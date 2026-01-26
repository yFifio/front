import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderStatusEmailRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  status: OrderStatus;
  orderItems: Array<{
    name: string;
    quantity: number;
  }>;
  totalPrice: number;
  trackingCode?: string;
}

const statusConfig: Record<OrderStatus, { emoji: string; title: string; message: string; color: string }> = {
  pending: {
    emoji: '⏳',
    title: 'Pedido Recebido',
    message: 'Recebemos seu pedido e estamos aguardando a confirmação do pagamento.',
    color: '#f59e0b',
  },
  paid: {
    emoji: '✅',
    title: 'Pagamento Confirmado!',
    message: 'Seu pagamento foi aprovado! Estamos preparando seu pedido.',
    color: '#22c55e',
  },
  processing: {
    emoji: '📦',
    title: 'Pedido em Preparação',
    message: 'Estamos preparando seu pedido com muito carinho!',
    color: '#8b5cf6',
  },
  shipped: {
    emoji: '🚀',
    title: 'Pedido Enviado!',
    message: 'Seu pedido está a caminho! Use o código de rastreio para acompanhar.',
    color: '#3b82f6',
  },
  delivered: {
    emoji: '🎉',
    title: 'Pedido Entregue!',
    message: 'Seu pedido foi entregue! Esperamos que você aproveite muito!',
    color: '#22c55e',
  },
  cancelled: {
    emoji: '❌',
    title: 'Pedido Cancelado',
    message: 'Seu pedido foi cancelado. Se tiver dúvidas, entre em contato conosco.',
    color: '#ef4444',
  },
};

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

    const { customerEmail, customerName, orderId, status, orderItems, totalPrice, trackingCode } = 
      (await req.json()) as OrderStatusEmailRequest;

    console.log("Sending order status email to:", customerEmail);
    console.log("Order ID:", orderId);
    console.log("Status:", status);

    const config = statusConfig[status];
    if (!config) {
      throw new Error(`Unknown status: ${status}`);
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(price);
    };

    const itemsHtml = orderItems
      .map(item => `<li style="padding: 4px 0;">${item.name} (x${item.quantity})</li>`)
      .join("");

    const trackingHtml = trackingCode ? `
      <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center;">
        <p style="color: #166534; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
          Código de Rastreio
        </p>
        <p style="color: #166534; font-size: 20px; font-weight: bold; margin: 0; letter-spacing: 2px;">
          ${trackingCode}
        </p>
        <a href="https://www.linkcorreios.com.br/?id=${trackingCode}" 
           target="_blank"
           style="display: inline-block; margin-top: 12px; color: #166534; text-decoration: underline; font-size: 14px;">
          Clique aqui para rastrear
        </a>
      </div>
    ` : '';

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
            
            <!-- Header with Status -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 48px; margin-bottom: 16px;">${config.emoji}</div>
              <h1 style="color: ${config.color}; font-size: 28px; margin: 0 0 8px 0;">${config.title}</h1>
              <p style="color: #71717a; font-size: 16px; margin: 0;">
                Olá ${customerName || "Cliente"}!
              </p>
            </div>

            <!-- Status Message -->
            <div style="background-color: #fafafa; border-left: 4px solid ${config.color}; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
              <p style="color: #3f3f46; font-size: 16px; margin: 0;">
                ${config.message}
              </p>
            </div>

            ${trackingHtml}

            <!-- Order Details -->
            <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #7c3aed; font-size: 16px; margin: 0 0 12px 0;">📋 Detalhes do Pedido</h3>
              <ul style="color: #3f3f46; font-size: 14px; margin: 0; padding-left: 20px; list-style: none;">
                ${itemsHtml}
              </ul>
              <div style="border-top: 1px solid #e9d5ff; margin-top: 12px; padding-top: 12px;">
                <p style="color: #7c3aed; font-size: 18px; font-weight: bold; margin: 0;">
                  Total: ${formatPrice(totalPrice)}
                </p>
              </div>
              <p style="color: #71717a; font-size: 12px; margin: 12px 0 0 0;">
                Pedido #${orderId.slice(0, 8)}...
              </p>
            </div>

            <!-- Help Section -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
              <p style="color: #71717a; font-size: 14px; margin: 0;">
                Precisa de ajuda? Entre em contato conosco!
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px;">
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
      subject: `${config.emoji} ${config.title} - Pedido #${orderId.slice(0, 8)}`,
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
    console.error("Error sending order status email:", error);
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
