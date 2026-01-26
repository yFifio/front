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

    const { token, fileId } = await req.json();

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
    if (download.orders?.status !== "paid") {
      return new Response(JSON.stringify({ error: "Pedido ainda não foi confirmado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Check if token is expired
    if (new Date(download.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link de download expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410,
      });
    }

    // Check download count
    if (download.download_count >= download.max_downloads) {
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
      .createSignedUrl(file.file_path, 0); // 0 minutes

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
        download_count: download.download_count + 1,
      })
      .eq("id", download.id);

    console.log("Download successful, count:", download.download_count + 1);

    return new Response(
      JSON.stringify({
        url: signedData.signedUrl,
        fileName: file.file_name,
        remainingDownloads: download.max_downloads - download.download_count - 1,
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
