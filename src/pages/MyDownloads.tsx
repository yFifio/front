import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { downloadFileToDevice } from '@/lib/download';
import { toast } from 'sonner';
import { DigitalDownloadsList, type DownloadItem } from '@/components/store/DigitalDownloadsList';

interface OrderItem {
  id: string;
  product_name: string;
  product_id: string | number | null;
  products: {
    category: string | null;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  status: string | null;
  created_at: string | null;
  total_price?: number;
  order_items: OrderItem[];
  downloads?: DownloadItem[];
}

const MyDownloads = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'downloads' | 'history'>('downloads');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [authLoading, user, navigate]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest(`/orders?userId=${user?.id}`);
      const list: Order[] = Array.isArray(data) ? data : data?.data || data?.rows || [];

      const withSimulatedTokens = list.map((order) => {
        const isEligible = order.status === 'paid' || order.status === 'delivered';
        if (!isEligible) return order;

        const digitalItems = order.order_items?.filter(
          (item) => item.products?.category === 'digital' && item.product_id != null
        ) || [];
        if (digitalItems.length === 0) return order;

        const existing: DownloadItem[] = order.downloads || [];
        const simulated: DownloadItem[] = digitalItems
          .filter((item) => !existing.find((d) => d.product_id === item.product_id))
          .map((item) => ({
            id: `sim_${order.id}_${item.id}`,
            download_token: `sim_${order.id}_${item.product_id}_${encodeURIComponent(item.product_name)}`,
            download_count: 0,
            max_downloads: null,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            product_id: item.product_id,
          }));

        return { ...order, downloads: [...existing, ...simulated] };
      });

      setOrders(withSimulatedTokens);
    } catch (error) {
      toast.error('Erro ao carregar seus downloads');
    } finally {
      setIsLoading(false);
    }
  };

  const digitalOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          (order.status === 'paid' || order.status === 'delivered') &&
          order.order_items?.some((item) => item.products?.category === 'digital')
      ),
    [orders]
  );

  const handleDownload = async (download: DownloadItem) => {
    if (!download.download_token) {
      toast.error('Token de download não encontrado');
      return;
    }

    setDownloadingId(download.id);

    try {
      const data = await apiRequest('/downloads/request', {
        method: 'POST',
        body: JSON.stringify({ token: download.download_token }),
      });

      if (data?.url) {
        await downloadFileToDevice(data.url, data.fileName || 'livro-digital.pdf');
        if (data.simulated) {
          toast.success('Arquivo baixado no seu computador! (modo demonstração)');
        } else {
          toast.success(
            data.remainingDownloads == null
              ? 'Arquivo baixado no seu computador!'
              : `Arquivo baixado! Restam ${data.remainingDownloads} downloads.`
          );
        }
        fetchOrders();
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar download');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b">
          <div className="container py-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-40" />
          </div>
        </header>
        <main className="container py-8 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'downloads' | 'history')}>
          <TabsList className="grid w-full sm:w-auto grid-cols-2 mb-6">
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Downloads ({digitalOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="downloads">
            <DigitalDownloadsList
              orders={digitalOrders}
              downloadingId={downloadingId}
              onDownload={handleDownload}
              onBrowseProducts={() => navigate('/')}
              formatDate={formatDate}
              emptyDescription="Assim que seus pedidos digitais forem aprovados, seus arquivos aparecerão aqui."
            />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pedidos Digitais</CardTitle>
              </CardHeader>
              <CardContent>
                {digitalOrders.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {digitalOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between border rounded-md p-3">
                        <span>Pedido #{order.id}</span>
                        <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Você ainda não possui histórico de downloads.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyDownloads;
