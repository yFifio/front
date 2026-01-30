import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DownloadItem {
  id: string;
  download_token: string;
  expires_at: string;
  download_count: number | null;
  max_downloads: number | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

const MyDownloads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchDownloads = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch downloads for the current user through their orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", session.user.id);

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        setLoading(false);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        setLoading(false);
        return;
      }

      const orderIds = ordersData.map(o => o.id);

      const { data: downloadsData, error: downloadsError } = await supabase
        .from("downloads")
        .select(`
          id,
          download_token,
          expires_at,
          download_count,
          max_downloads,
          created_at,
          product:products(id, name, image_url)
        `)
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });

      if (downloadsError) {
        console.error("Error fetching downloads:", downloadsError);
      } else {
        setDownloads(downloadsData as unknown as DownloadItem[]);
      }

      setLoading(false);
    };

    checkAuthAndFetchDownloads();
  }, [navigate]);

  const handleDownload = async (download: DownloadItem) => {
    if (!download.product) return;

    const now = new Date();
    const expiresAt = new Date(download.expires_at);
    
    if (now > expiresAt) {
      toast({
        title: "Link expirado",
        description: "O link de download expirou.",
        variant: "destructive",
      });
      return;
    }

    const used = download.download_count ?? 0;
    const hasLimit = typeof download.max_downloads === "number";

    if (hasLimit && used >= (download.max_downloads as number)) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite máximo de downloads.",
        variant: "destructive",
      });
      return;
    }

    setDownloadingId(download.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para baixar.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("download-file", {
        body: {
          token: download.download_token,
          fileId: null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      
      // Open the signed URL directly in a new tab
      window.open(url, '_blank');

      // Update local state
      setDownloads(prev => 
        prev.map(d => 
          d.id === download.id 
            ? { ...d, download_count: (d.download_count ?? 0) + 1 }
            : d
        )
      );

      toast({
        title: "Download iniciado",
        description: "Seu arquivo está sendo baixado.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const isLimitReached = (download: DownloadItem) => {
    if (download.max_downloads == null) return false;
    return (download.download_count ?? 0) >= download.max_downloads;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a loja
        </Button>

        <h1 className="text-3xl font-bold mb-8">Meus Downloads</h1>

        {downloads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Você ainda não tem downloads disponíveis.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate("/")}
              >
                Explorar produtos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {downloads.map((download) => (
              <Card key={download.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {download.product?.name || "Produto"}
                    </CardTitle>
                    <div className="flex gap-2">
                      {isExpired(download.expires_at) && (
                        <Badge variant="destructive">Expirado</Badge>
                      )}
                      {isLimitReached(download) && !isExpired(download.expires_at) && (
                        <Badge variant="secondary">Limite atingido</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Downloads:{" "}
                        {download.max_downloads == null
                          ? `${download.download_count ?? 0} / Ilimitado`
                          : `${download.download_count ?? 0} / ${download.max_downloads}`}
                      </p>
                      <p>
                        Expira em: {format(new Date(download.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDownload(download)}
                      disabled={
                        isExpired(download.expires_at) ||
                        isLimitReached(download) ||
                        downloadingId === download.id
                      }
                    >
                      {downloadingId === download.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDownloads;
