import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadEmailRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { orderId, customerEmail, customerName } = (await req.json()) as DownloadEmailRequest;

    console.log("Sending download email for order:", orderId);

    // Get order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        quantity,
        price_at_purchase,
        products!inner(category)
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      throw new Error("Failed to fetch order items");
    }

    // Get download tokens for digital products
    const { data: downloads, error: downloadsError } = await supabase
      .from("downloads")
      .select("product_id, download_token, expires_at, max_downloads")
      .eq("order_id", orderId);

    if (downloadsError) {
      console.error("Error fetching downloads:", downloadsError);
    }

    // Filter digital products
    const digitalItems = orderItems?.filter(
      (item: any) => item.products?.category === "digital"
    ) || [];

    const physicalItems = orderItems?.filter(
      (item: any) => item.products?.category === "physical"
    ) || [];

    // Build download links HTML
    const downloadMap = new Map(downloads?.map(d => [d.product_id, d]) || []);
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(price);
    };

    // Get the site URL for download links
    const siteUrl = Deno.env.get("SITE_URL") || "https://id-preview--fb105b3d-9172-4a39-8a87-ecb9e8d404cc.lovable.app";

    const digitalItemsHtml = digitalItems.length > 0 ? `
      <div style="background-color: #ecfdf5; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #059669; font-size: 18px; margin: 0 0 16px 0;">📥 Seus Downloads</h3>
        <p style="color: #047857; font-size: 14px; margin: 0 0 16px 0;">
          Seus produtos digitais estão prontos! Clique nos links abaixo para baixar:
        </p>
        ${digitalItems.map((item: any) => {
          const download = downloadMap.get(item.product_id);
          const downloadUrl = download 
            ? `${siteUrl}/my-downloads?token=${download.download_token}`
            : "#";
          const expiresAt = download 
            ? new Date(download.expires_at).toLocaleDateString('pt-BR')
            : "N/A";
           const maxDownloadsLabel = download?.max_downloads == null ? "Ilimitado" : String(download.max_downloads);
          
          return `
            <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #a7f3d0;">
              <p style="color: #1f2937; font-weight: bold; margin: 0 0 8px 0;">${item.product_name}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 12px 0;">
                Quantidade: ${item.quantity} • ${formatPrice(item.price_at_purchase)}
              </p>
              <a href="${downloadUrl}" 
                 style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px;">
                ⬇️ Baixar Agora
              </a>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                 Válido até ${expiresAt} • Downloads: ${maxDownloadsLabel}
              </p>
            </div>
          `;
        }).join("")}
      </div>
    ` : "";

    const physicalItemsHtml = physicalItems.length > 0 ? `
      <div style="background-color: #fef3c7; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #d97706; font-size: 18px; margin: 0 0 16px 0;">📦 Produtos Físicos</h3>
        <p style="color: #92400e; font-size: 14px; margin: 0 0 16px 0;">
          Os produtos abaixo serão enviados em breve. Você receberá outro email com o código de rastreio!
        </p>
        ${physicalItems.map((item: any) => `
          <div style="background-color: #ffffff; border-radius: 8px; padding: 12px; margin-bottom: 8px; border: 1px solid #fcd34d;">
            <p style="color: #1f2937; font-weight: bold; margin: 0;">${item.product_name}</p>
            <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">
              Quantidade: ${item.quantity} • ${formatPrice(item.price_at_purchase)}
            </p>
          </div>
        `).join("")}
      </div>
    ` : "";

    const totalPrice = orderItems?.reduce((sum: number, item: any) => 
      sum + (item.price_at_purchase * item.quantity), 0) || 0;

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
              <div style="font-size: 56px; margin-bottom: 16px;">🎉</div>
              <h1 style="color: #7c3aed; font-size: 28px; margin: 0 0 8px 0;">Compra Confirmada!</h1>
              <p style="color: #71717a; font-size: 16px; margin: 0;">
                Olá ${customerName || "Cliente"}! Obrigado pela sua compra!
              </p>
            </div>

            <!-- Success Message -->
            <div style="background-color: #faf5ff; border-left: 4px solid #7c3aed; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
              <p style="color: #6d28d9; font-size: 16px; margin: 0;">
                Seu pagamento foi aprovado e ${digitalItems.length > 0 ? "seus produtos digitais já estão disponíveis para download!" : "seu pedido está sendo preparado!"}
              </p>
            </div>

            ${digitalItemsHtml}
            ${physicalItemsHtml}

            <!-- Total -->
            <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px 0;">Total do Pedido</p>
              <p style="color: #7c3aed; font-size: 28px; font-weight: bold; margin: 0;">
                ${formatPrice(totalPrice)}
              </p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 8px 0 0 0;">
                Pedido #${orderId.slice(0, 8)}...
              </p>
            </div>

            <!-- My Orders Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${siteUrl}/my-orders" 
                 style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Ver Meus Pedidos
              </a>
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
      subject: `🎉 Compra Confirmada! ${digitalItems.length > 0 ? "Seus downloads estão prontos!" : ""} - Pedido #${orderId.slice(0, 8)}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Download email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending download email:", error);
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
