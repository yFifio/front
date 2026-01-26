import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface DownloadItem {
  id: string;
  download_token: string;
  download_count: number | null;
  max_downloads: number | null;
  expires_at: string;
  product_id: string | null;
  products: {
    name: string;
    category: string | null;
  } | null;
}

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { clearCart } = useCart();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    clearCart();
    
    if (orderId) {
      const fetchDownloads = async () => {
        const { data } = await supabase
          .from('downloads')
          .select('*, products:product_id(name, category)')
          .eq('order_id', orderId);
        
        if (data) {
          // Filter only digital products
          const digitalDownloads = data.filter(
            (d: any) => d.products?.category === 'digital'
          ) as DownloadItem[];
          setDownloads(digitalDownloads);
        }
        setIsLoading(false);
      };
      
      // Wait a bit for webhook to process
      setTimeout(fetchDownloads, 2000);
    } else {
      setIsLoading(false);
    }
  }, [orderId, clearCart]);

  const handleDownload = async (download: DownloadItem) => {
    if (!download.download_token) {
      toast.error('Token de download não encontrado');
      return;
    }

    setDownloadingId(download.id);

    try {
      const { data, error } = await supabase.functions.invoke('download-file', {
        body: { token: download.download_token },
      });

      if (error) throw error;

      if (data?.url) {
        // Open directly in new window - more reliable for downloads
        window.open(data.url, '_blank');

        toast.success(`Download iniciado! Restam ${data.remainingDownloads} downloads.`);
        
        // Update local download count
        setDownloads(prev => 
          prev.map(d => 
            d.id === download.id 
              ? { ...d, download_count: (d.download_count || 0) + 1 }
              : d
          )
        );
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error(err.message || 'Erro ao baixar arquivo');
    } finally {
      setDownloadingId(null);
    }
  };

  const getRemainingDownloads = (download: DownloadItem) => {
    const max = download.max_downloads || 5;
    const used = download.download_count || 0;
    return max - used;
  };

  const isExpired = (download: DownloadItem) => {
    return new Date(download.expires_at) < new Date();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center shadow-playful">
        <CardHeader>
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
          <CardTitle className="text-2xl font-display">Compra Realizada! 🎉</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Obrigado pela sua compra! Seus downloads estão disponíveis abaixo.
          </p>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : downloads.length > 0 ? (
            <div className="space-y-3">
              {downloads.map((download) => {
                const remaining = getRemainingDownloads(download);
                const expired = isExpired(download);
                const exhausted = remaining <= 0;
                const disabled = expired || exhausted;

                return (
                  <div 
                    key={download.id} 
                    className="p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {download.products?.name || 'Produto Digital'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expired ? (
                            <span className="text-destructive">Link expirado</span>
                          ) : exhausted ? (
                            <span className="text-destructive">Downloads esgotados</span>
                          ) : (
                            `${remaining} downloads restantes`
                          )}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        disabled={disabled || downloadingId === download.id}
                        onClick={() => handleDownload(download)}
                      >
                        {downloadingId === download.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : disabled ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Você receberá um email com os links de download em breve.
            </p>
          )}
          
          <Button onClick={() => navigate('/')} className="w-full mt-4">
            Voltar para a Loja
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
