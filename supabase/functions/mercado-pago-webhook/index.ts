import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify Mercado Pago webhook signature
async function verifySignature(
  req: Request,
  body: string,
  dataId: string
): Promise<boolean> {
  const WEBHOOK_SECRET = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  
  // If no secret configured, log warning but allow (for backward compatibility during setup)
  if (!WEBHOOK_SECRET) {
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET not configured - signature verification skipped");
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    console.error("Missing signature headers: x-signature or x-request-id");
    return false;
  }

  // Parse x-signature header (format: ts=xxx,v1=xxx)
  const parts = xSignature.split(",");
  let ts = "";
  let hash = "";
  
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "ts") ts = value;
    if (key === "v1") hash = value;
  }

  if (!ts || !hash) {
    console.error("Invalid signature format - missing ts or v1");
    return false;
  }

  // Build manifest according to Mercado Pago spec
  // Format: id:{data.id};request-id:{x-request-id};ts:{ts};
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Create HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(manifest)
  );

  // Convert to hex string
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const isValid = expectedSignature === hash;
  
  if (!isValid) {
    console.error("Signature verification failed", {
      manifest,
      expected: expectedSignature,
      received: hash,
    });
  }

  return isValid;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    // Read body as text first for signature verification
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Mercado Pago sends different notification types
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

      // Verify webhook signature before processing
      const isValidSignature = await verifySignature(req, bodyText, String(paymentId));
      
      if (!isValidSignature) {
        console.error("Invalid webhook signature - rejecting request");
        return new Response("Unauthorized", { status: 401 });
      }

      console.log("Signature verified successfully");

      // Fetch payment details from Mercado Pago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error("Error fetching payment:", errorText);
        return new Response("OK", { status: 200 });
      }

      const payment = await mpResponse.json();
      console.log("Payment details:", JSON.stringify(payment, null, 2));

      const orderId = payment.external_reference;
      const status = payment.status;
      const paymentMethod = payment.payment_method_id;

      if (!orderId) {
        console.log("No order ID (external_reference) in payment");
        return new Response("OK", { status: 200 });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Update payment record
      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({
          mercado_pago_id: String(paymentId),
          status: status,
          payment_method: paymentMethod,
          payer_email: payment.payer?.email,
          raw_data: payment,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (paymentUpdateError) {
        console.error("Error updating payment:", paymentUpdateError);
        
        // Try to insert if update failed (payment might not exist)
        const { error: insertError } = await supabase.from("payments").insert({
          order_id: orderId,
          mercado_pago_id: String(paymentId),
          status: status,
          amount: payment.transaction_amount,
          payment_method: paymentMethod,
          payer_email: payment.payer?.email,
          raw_data: payment,
        });
        
        if (insertError) {
          console.error("Error inserting payment:", insertError);
        }
      }

       // If payment is approved, update order and create download tokens
      if (status === "approved") {
        console.log("Payment approved! Updating order and creating downloads...");

        // Get order items to check if all products are digital
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("product_id, products:product_id(category)")
          .eq("order_id", orderId);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
        }

         const items = orderItems ?? [];
         const digitalItems = items.filter((item: any) => item.products?.category === "digital");

         // Check if all products in the order are digital
         const allDigital = items.length > 0 && digitalItems.length === items.length;

        // If all products are digital, mark as delivered; otherwise just paid
        const newStatus = allDigital ? "delivered" : "paid";
        console.log(`Order contains ${allDigital ? "only digital" : "physical"} products. Setting status to: ${newStatus}`);

        // Update order status
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", orderId);

        if (orderError) {
          console.error("Error updating order:", orderError);
        }

         // Create download tokens for digital products (idempotent)
         if (!itemsError && digitalItems.length > 0) {
           const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // ~1 month

           const digitalProductIds = digitalItems.map((i: any) => i.product_id).filter(Boolean);

           // Avoid duplicates on webhook retries
           const { data: existingDownloads, error: existingError } = await supabase
             .from("downloads")
             .select("id, product_id")
             .eq("order_id", orderId)
             .in("product_id", digitalProductIds);

           if (existingError) {
             console.error("Error checking existing downloads:", existingError);
           }

           const existingSet = new Set((existingDownloads ?? []).map((d: any) => d.product_id));
           const downloadsToCreate = digitalProductIds
             .filter((pid: string) => !existingSet.has(pid))
             .map((productId: string) => ({
               order_id: orderId,
               product_id: productId,
               download_token: crypto.randomUUID(),
               expires_at: expiresAt,
               max_downloads: null, // unlimited within the validity window
               download_count: 0,
             }));

           if (downloadsToCreate.length === 0) {
             console.log("Downloads already exist for this order (webhook retry). Skipping creation.");
           } else {
             const { error: downloadError } = await supabase
               .from("downloads")
               .insert(downloadsToCreate);

              if (downloadError) {
                console.error("Error creating downloads:", downloadError);
              } else {
                console.log("Downloads created successfully!", { count: downloadsToCreate.length });

                // Get order email for sending notification
                const { data: order } = await supabase
                  .from("orders")
                  .select("customer_email, customer_name")
                  .eq("id", orderId)
                  .single();

                if (order) {
                  console.log(`Order completed for ${order.customer_email}`);

                  // Send download/confirmation email automatically
                  try {
                    const emailResponse = await fetch(
                      `${SUPABASE_URL}/functions/v1/send-download-email`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        },
                        body: JSON.stringify({
                          orderId: orderId,
                          customerEmail: order.customer_email,
                          customerName: order.customer_name,
                        }),
                      }
                    );

                    if (emailResponse.ok) {
                      console.log("Download email sent successfully!");
                    } else {
                      console.error("Failed to send download email:", await emailResponse.text());
                    }
                  } catch (emailError) {
                    console.error("Error sending download email:", emailError);
                  }
                }
              }
            }
          }
        }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to Mercado Pago to prevent retries
    return new Response("OK", { status: 200 });
  }
});
