import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackingEmailRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  trackingCode: string;
  orderItems: Array<{
    name: string;
    quantity: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    const { customerEmail, customerName, orderId, trackingCode, orderItems } = 
      (await req.json()) as TrackingEmailRequest;

    console.log("Sending tracking email to:", customerEmail);
    console.log("Order ID:", orderId);
    console.log("Tracking code:", trackingCode);

    // Build items list HTML
    const itemsHtml = orderItems
      .map(item => `<li>${item.name} (x${item.quantity})</li>`)
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #7c3aed; font-size: 28px; margin: 0 0 8px 0;">🚀 Seu pedido foi enviado!</h1>
              <p style="color: #71717a; font-size: 16px; margin: 0;">
                Olá ${customerName || "Cliente"}! Temos boas notícias!
              </p>
            </div>

            <!-- Tracking Code Box -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                Código de Rastreio
              </p>
              <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">
                ${trackingCode}
              </p>
            </div>

            <!-- Order Details -->
            <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #7c3aed; font-size: 16px; margin: 0 0 12px 0;">📦 Itens do pedido:</h3>
              <ul style="color: #3f3f46; font-size: 14px; margin: 0; padding-left: 20px;">
                ${itemsHtml}
              </ul>
              <p style="color: #71717a; font-size: 12px; margin: 12px 0 0 0;">
                Pedido #${orderId.slice(0, 8)}...
              </p>
            </div>

            <!-- Track Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://www.linkcorreios.com.br/?id=${trackingCode}" 
                 target="_blank"
                 style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Rastrear Pedido
              </a>
            </div>

            <!-- Info -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0;">
                Você pode acompanhar seu pedido no site dos Correios ou 
                clicando no botão acima. Qualquer dúvida, estamos à disposição!
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Aventuras Mágicas • Todos os direitos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Aventuras Mágicas <noreply@resend.dev>",
      to: [customerEmail],
      subject: `🚀 Seu pedido foi enviado! Rastreio: ${trackingCode}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending tracking email:", error);
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
