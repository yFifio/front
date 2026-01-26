import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Mercado Pago sends different notification types
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

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

        // Update order status
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId);

        if (orderError) {
          console.error("Error updating order:", orderError);
        }

        // Get order items
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("product_id")
          .eq("order_id", orderId);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
        } else if (orderItems) {
          // Create download tokens for each product
          const downloads = orderItems.map((item) => ({
            order_id: orderId,
            product_id: item.product_id,
            download_token: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            max_downloads: 5,
          }));

          const { error: downloadError } = await supabase
            .from("downloads")
            .insert(downloads);

          if (downloadError) {
            console.error("Error creating downloads:", downloadError);
          } else {
            console.log("Downloads created successfully!");
            
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

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to Mercado Pago to prevent retries
    return new Response("OK", { status: 200 });
  }
});
