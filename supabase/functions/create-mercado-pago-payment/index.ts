import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentItem {
  title: string;
  quantity: number;
  unit_price: number;
}

interface PaymentRequest {
  orderId: string;
  items: PaymentItem[];
  payer: {
    email: string;
    name: string;
  };
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

    const { orderId, items, payer } = (await req.json()) as PaymentRequest;

    console.log("Creating Mercado Pago payment for order:", orderId);

    // Get the function URL for the webhook
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`;

    // Create Mercado Pago preference
    const preference = {
      items: items.map((item, index) => ({
        id: `item_${index}`,
        title: item.title,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      })),
      payer: {
        email: payer.email,
        name: payer.name,
      },
      back_urls: {
        success: `${req.headers.get("origin")}/order-success?order_id=${orderId}`,
        failure: `${req.headers.get("origin")}/checkout?error=payment_failed`,
        pending: `${req.headers.get("origin")}/order-pending?order_id=${orderId}`,
      },
      auto_return: "approved",
      external_reference: orderId,
      notification_url: webhookUrl,
      statement_descriptor: "AVENTURAS MAGICAS",
    };

    console.log("Creating preference:", JSON.stringify(preference, null, 2));

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(preference),
      }
    );

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago error:", errorText);
      throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();

    console.log("Mercado Pago preference created:", mpData.id);

    // Create initial payment record
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId,
      mercado_pago_id: mpData.id,
      status: "pending",
      amount: items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
      payer_email: payer.email,
    });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
    }

    return new Response(
      JSON.stringify({
        id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
