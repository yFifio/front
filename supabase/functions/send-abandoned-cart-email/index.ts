import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface AbandonedCartEmailRequest {
  customerEmail: string;
  customerName?: string;
  cartItems: CartItem[];
  totalPrice: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    const { customerEmail, customerName, cartItems, totalPrice } = 
      (await req.json()) as AbandonedCartEmailRequest;

    console.log("Sending abandoned cart email to:", customerEmail);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(price);
    };

    const siteUrl = Deno.env.get("SITE_URL") || "https://id-preview--fb105b3d-9172-4a39-8a87-ecb9e8d404cc.lovable.app";

    const cartItemsHtml = cartItems.map(item => `
      <div style="display: flex; align-items: center; padding: 16px; background-color: #ffffff; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
        <div style="width: 60px; height: 60px; background-color: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
          ${item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`
            : `<span style="font-size: 24px;">📦</span>`
          }
        </div>
        <div style="flex: 1;">
          <p style="color: #1f2937; font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${item.name}</p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Qtd: ${item.quantity}</p>
        </div>
        <div style="text-align: right;">
          <p style="color: #7c3aed; font-weight: bold; margin: 0; font-size: 16px;">${formatPrice(item.price * item.quantity)}</p>
        </div>
      </div>
    `).join("");

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
              <div style="font-size: 56px; margin-bottom: 16px;">🛒</div>
              <h1 style="color: #7c3aed; font-size: 26px; margin: 0 0 8px 0;">Esqueceu algo?</h1>
              <p style="color: #71717a; font-size: 16px; margin: 0;">
                Olá ${customerName || ""}! Notamos que você deixou alguns itens no carrinho.
              </p>
            </div>

            <!-- Friendly Message -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
              <p style="color: #92400e; font-size: 15px; margin: 0;">
                🎁 Esses produtos ainda estão esperando por você! Complete sua compra antes que acabem.
              </p>
            </div>

            <!-- Cart Items -->
            <div style="margin: 24px 0;">
              <h3 style="color: #3f3f46; font-size: 16px; margin: 0 0 16px 0;">Seus itens no carrinho:</h3>
              ${cartItemsHtml}
            </div>

            <!-- Total -->
            <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px 0;">Total do Carrinho</p>
              <p style="color: #7c3aed; font-size: 32px; font-weight: bold; margin: 0;">
                ${formatPrice(totalPrice)}
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${siteUrl}" 
                 style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
                🛒 Finalizar Compra
              </a>
            </div>

            <!-- Benefits -->
            <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h4 style="color: #059669; font-size: 14px; margin: 0 0 12px 0;">Por que comprar conosco?</h4>
              <ul style="color: #047857; font-size: 13px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 6px;">✅ Download imediato para produtos digitais</li>
                <li style="margin-bottom: 6px;">✅ Pagamento 100% seguro via Mercado Pago</li>
                <li style="margin-bottom: 6px;">✅ Entrega rápida para produtos físicos</li>
                <li>✅ Suporte dedicado</li>
              </ul>
            </div>

            <!-- Help Section -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
              <p style="color: #71717a; font-size: 14px; margin: 0;">
                Precisa de ajuda? Estamos aqui para você!
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #a1a1aa; font-size: 11px; margin: 0 0 8px 0;">
              Você está recebendo este email porque adicionou itens ao carrinho em nossa loja.
            </p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Biblioteca de Brincar • Todos os direitos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Biblioteca de Brincar <noreply@resend.dev>",
      to: [customerEmail],
      subject: `🛒 Você esqueceu algo! Seus itens estão esperando`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Abandoned cart email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending abandoned cart email:", error);
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
