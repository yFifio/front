import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Loader2, AlertCircle, Package, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadItem {
  id: string;
  download_token: string;
  download_count: number | null;
  max_downloads: number | null;
  expires_at: string;
  product_id: string | null;
  order_id: string | null;
  products: {
    name: string;
    category: string | null;
    image_url: string | null;
  } | null;
  orders: {
    id: string;
    status: string | null;
    created_at: string | null;
    total_price: number;
  } | null;
}

interface GroupedOrder {
  orderId: string;
  createdAt: string | null;
  totalPrice: number;
  status: string | null;
  downloads: DownloadItem[];
}

const MyDownloads = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchUserDownloads();
    }
  }, [user, authLoading, navigate]);

  const fetchUserDownloads = async () => {
    try {
      // Get orders for current user that are paid or delivered
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, created_at, total_price')
        .eq('customer_id', user?.id)
        .in('status', ['paid', 'delivered'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        setGroupedOrders([]);
        setIsLoading(false);
        return;
      }

      // Get downloads for these orders
      const orderIds = orders.map(o => o.id);
      const { data: downloads, error: downloadsError } = await supabase
        .from('downloads')
        .select('*, products:product_id(name, category, image_url)')
        .in('order_id', orderIds);

      if (downloadsError) throw downloadsError;

      // Group downloads by order
      const grouped: GroupedOrder[] = orders.map(order => ({
        orderId: order.id,
        createdAt: order.created_at,
        totalPrice: order.total_price,
        status: order.status,
        downloads: (downloads || [])
          .filter(d => d.order_id === order.id && d.products?.category === 'digital')
          .map(d => ({
            ...d,
            orders: order
          })) as DownloadItem[],
      })).filter(g => g.downloads.length > 0);

      setGroupedOrders(grouped);
    } catch (err) {
      console.error('Error fetching downloads:', err);
      toast.error('Erro ao carregar seus downloads');
    } finally {
      setIsLoading(false);
    }
  };

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
        const link = document.createElement('a');
        link.href = data.url;
        link.download = data.fileName || 'download.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Download iniciado! Restam ${data.remainingDownloads} downloads.`);
        
        // Refresh downloads to update count
        fetchUserDownloads();
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b">
          <div className="container py-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container py-8">
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-display">Meus Downloads</h1>
        </div>
      </header>
      
      <main className="container py-8">
        {groupedOrders.length > 0 ? (
          <div className="space-y-6">
            {groupedOrders.map((order) => (
              <Card key={order.orderId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Pedido de {order.createdAt && formatDate(order.createdAt)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total: {formatPrice(order.totalPrice)}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                      Pago
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.downloads.map((download) => {
                      const remaining = getRemainingDownloads(download);
                      const expired = isExpired(download);
                      const exhausted = remaining <= 0;
                      const disabled = expired || exhausted;

                      return (
                        <div 
                          key={download.id} 
                          className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {download.products?.image_url ? (
                              <img 
                                src={download.products.image_url} 
                                alt={download.products.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileText className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {download.products?.name || 'Produto Digital'}
                            </p>
                            <p className="text-sm text-muted-foreground">
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
                            className="flex-shrink-0"
                          >
                            {downloadingId === download.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Baixando...
                              </>
                            ) : disabled ? (
                              <>
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Indisponível
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Baixar
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Download className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">Nenhum download disponível</h3>
              <p className="text-muted-foreground text-center mb-6">
                Você ainda não possui compras digitais pagas.
              </p>
              <Button onClick={() => navigate('/')}>
                Ver Produtos Digitais
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyDownloads;
