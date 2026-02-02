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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const token = body?.token ?? body?.downloadToken;
    const fileId = body?.fileId;

    if (!token) {
      return new Response(JSON.stringify({ error: "Token de download não fornecido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Download request with token:", token);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify download token
    const { data: download, error: downloadError } = await supabase
      .from("downloads")
      .select("*, orders!inner(status)")
      .eq("download_token", token)
      .single();

    if (downloadError || !download) {
      console.error("Download not found:", downloadError);
      return new Response(JSON.stringify({ error: "Link de download inválido ou expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Check if order is paid
    if (download.orders?.status !== "paid" && download.orders?.status !== "delivered") {
      return new Response(JSON.stringify({ error: "Pedido ainda não foi confirmado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Check if token is expired (consider > 50 years from now as "never expires")
    const expiresAt = new Date(download.expires_at);
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    
    if (expiresAt < fiftyYearsFromNow && expiresAt < new Date()) {
      return new Response(JSON.stringify({ error: "Link de download expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410,
      });
    }

    const downloadCount = Number(download.download_count ?? 0);
    const maxDownloads = download.max_downloads as number | null;

    // Check download count (unlimited when max_downloads is null)
    if (typeof maxDownloads === "number" && downloadCount >= maxDownloads) {
      return new Response(JSON.stringify({ error: "Número máximo de downloads atingido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // Get digital files for this product
    const { data: files, error: filesError } = await supabase
      .from("digital_files")
      .select("*")
      .eq("product_id", download.product_id);

    if (filesError || !files || files.length === 0) {
      console.error("No files found:", filesError);
      return new Response(JSON.stringify({ error: "Nenhum arquivo encontrado para este produto" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // If fileId is specified, get that specific file, otherwise get the first one
    const file = fileId ? files.find((f) => f.id === fileId) : files[0];

    if (!file) {
      return new Response(JSON.stringify({ error: "Arquivo não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Generating signed URL for:", file.file_path);

    // Generate signed URL for the file
    const { data: signedData, error: signedError } = await supabase.storage
      .from("digital-products")
      .createSignedUrl(file.file_path, 300); // 5 minutes

    if (signedError || !signedData) {
      console.error("Error creating signed URL:", signedError);
      return new Response(JSON.stringify({ error: "Erro ao gerar link de download" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Increment download count
    await supabase
      .from("downloads")
      .update({
        download_count: downloadCount + 1,
      })
      .eq("id", download.id);

    console.log("Download successful, count:", downloadCount + 1);

    return new Response(
      JSON.stringify({
        url: signedData.signedUrl,
        fileName: file.file_name,
        remainingDownloads:
          typeof maxDownloads === "number" ? Math.max(0, maxDownloads - (downloadCount + 1)) : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Download error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
