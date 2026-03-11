import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, Download, Loader2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number | null;
  price_at_purchase: number;
  product_id: string | null;
  products: {
    category: string | null;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  customer_email: string;
  customer_name: string | null;
  total_price: number;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_items: OrderItem[];
}

interface DownloadItem {
  id: string;
  download_token: string;
  download_count: number | null;
  max_downloads: number | null;
  expires_at: string;
  product_id: string | null;
}

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloads, setDownloads] = useState<Record<string, DownloadItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'physical' | 'digital'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchUserOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchUserOrders = async () => {
    try {
      const ordersData = await apiRequest(`/orders?userId=${user?.id}`);
      const list = Array.isArray(ordersData) ? ordersData : (ordersData?.data || ordersData?.rows || []);
      setOrders(list);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Erro ao carregar seus pedidos');
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
      const data = await apiRequest('/downloads/request', {
        method: 'POST',
        body: JSON.stringify({ token: download.download_token })
      });

      if (data?.url) {
        window.open(data.url, '_blank');

        toast.success(
          data.remainingDownloads == null
            ? 'Download iniciado! Downloads ilimitados.'
            : `Download iniciado! Restam ${data.remainingDownloads} downloads.`
        );
        fetchUserOrders();
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar arquivo');
    } finally {
      setDownloadingId(null);
    }
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

  const getStatusInfo = (status: string | null) => {
    const statusMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      pending: { 
        label: 'Aguardando Pagamento', 
        icon: <Clock className="w-4 h-4" />, 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
      },
      paid: { 
        label: 'Pago - Preparando Envio', 
        icon: <Package className="w-4 h-4" />, 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
      },
      shipped: { 
        label: 'Enviado', 
        icon: <Truck className="w-4 h-4" />, 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
      },
      delivered: { 
        label: 'Entregue', 
        icon: <CheckCircle className="w-4 h-4" />, 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
      },
      cancelled: { 
        label: 'Cancelado', 
        icon: <XCircle className="w-4 h-4" />, 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
    };
    return statusMap[status || 'pending'] || statusMap.pending;
  };

  const hasPhysicalItems = (order: Order) => {
    return order.order_items.some(item => item.products?.category === 'physical');
  };

  const hasDigitalItems = (order: Order) => {
    return order.order_items.some(item => item.products?.category === 'digital');
  };

  const physicalOrders = orders.filter(hasPhysicalItems);
  const digitalOrders = orders.filter(o => hasDigitalItems(o) && (o.status === 'paid' || o.status === 'delivered'));

  const getRemainingDownloads = (download: DownloadItem) => {
    if (download.max_downloads == null) return null;
    const max = download.max_downloads;
    const used = download.download_count || 0;
    return max - used;
  };

  const isExpired = (download: DownloadItem) => {
    const expDate = new Date(download.expires_at);
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    if (expDate > fiftyYearsFromNow) return false;
    return expDate < new Date();
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
          <h1 className="text-xl font-bold font-display">Meus Pedidos</h1>
        </div>
      </header>
      
      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'physical' | 'digital')}>
          <TabsList className="grid w-full sm:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Todos ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="physical" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Entregas ({physicalOrders.length})
            </TabsTrigger>
            <TabsTrigger value="digital" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Downloads ({digitalOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const isDigitalOnly = order.order_items.every(item => item.products?.category === 'digital');
                  const isPhysicalOnly = order.order_items.every(item => item.products?.category === 'physical');
                  const orderType = isDigitalOnly ? 'Digital' : isPhysicalOnly ? 'Físico' : 'Misto';

                  return (
                    <Card key={order.id}>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg font-display flex items-center gap-2">
                              <Package className="w-5 h-5 text-primary" />
                              Pedido de {order.created_at && formatDate(order.created_at)}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                {orderType}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(order.total_price)}
                              </p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30"
                            >
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.products?.image_url ? (
                                  <img 
                                    src={item.products.image_url} 
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : item.products?.category === 'digital' ? (
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qtd: {item.quantity || 1} • {formatPrice(item.price_at_purchase)}
                                </p>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded bg-muted/50">
                                {item.products?.category === 'digital' ? 'Digital' : 'Físico'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.status !== 'cancelled' && order.status !== 'pending' && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-3">Status do Pedido:</p>
                            {isDigitalOnly ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  order.status === 'paid' || order.status === 'delivered'
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                                <div className={`flex-1 h-1 rounded ${
                                  order.status === 'delivered'
                                    ? 'bg-primary' 
                                    : 'bg-muted'
                                }`} />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  order.status === 'delivered'
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Download className="w-4 h-4" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  ['paid', 'shipped', 'delivered'].includes(order.status || '') 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Package className="w-4 h-4" />
                                </div>
                                <div className={`flex-1 h-1 rounded ${
                                  ['shipped', 'delivered'].includes(order.status || '') 
                                    ? 'bg-primary' 
                                    : 'bg-muted'
                                }`} />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  ['shipped', 'delivered'].includes(order.status || '') 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Truck className="w-4 h-4" />
                                </div>
                                <div className={`flex-1 h-1 rounded ${
                                  order.status === 'delivered' 
                                    ? 'bg-primary' 
                                    : 'bg-muted'
                                }`} />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  order.status === 'delivered' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                            <div className={`flex justify-between mt-2 text-xs text-muted-foreground ${isDigitalOnly ? '' : ''}`}>
                              {isDigitalOnly ? (
                                <>
                                  <span>Pago</span>
                                  <span>Disponível</span>
                                </>
                              ) : (
                                <>
                                  <span>Preparando</span>
                                  <span>Enviado</span>
                                  <span>Entregue</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {order.status === 'cancelled' && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 text-destructive">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Pedido cancelado</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-bold text-lg mb-2">Nenhum pedido ainda</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Você ainda não realizou nenhuma compra.
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Ver Produtos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="physical">
            {physicalOrders.length > 0 ? (
              <div className="space-y-4">
                {physicalOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const physicalItems = order.order_items.filter(
                    item => item.products?.category === 'physical'
                  );

                  return (
                    <Card key={order.id}>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg font-display">
                              Pedido de {order.created_at && formatDate(order.created_at)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Total: {formatPrice(order.total_price)}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {physicalItems.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.products?.image_url ? (
                                  <img 
                                    src={item.products.image_url} 
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.product_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qtd: {item.quantity || 1} • {formatPrice(item.price_at_purchase)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-3">Acompanhamento:</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              ['paid', 'shipped', 'delivered'].includes(order.status || '') 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Package className="w-4 h-4" />
                            </div>
                            <div className={`flex-1 h-1 rounded ${
                              ['shipped', 'delivered'].includes(order.status || '') 
                                ? 'bg-primary' 
                                : 'bg-muted'
                            }`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              ['shipped', 'delivered'].includes(order.status || '') 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Truck className="w-4 h-4" />
                            </div>
                            <div className={`flex-1 h-1 rounded ${
                              order.status === 'delivered' 
                                ? 'bg-primary' 
                                : 'bg-muted'
                            }`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              order.status === 'delivered' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>Preparando</span>
                            <span>Enviado</span>
                            <span>Entregue</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-bold text-lg mb-2">Nenhum pedido físico</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Você ainda não possui pedidos de livros físicos.
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Ver Livros Físicos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="digital">
            {digitalOrders.length > 0 ? (
              <div className="space-y-4">
                {digitalOrders.map((order) => {
                  const digitalItems = order.order_items.filter(
                    item => item.products?.category === 'digital'
                  );
                  const orderDownloads = downloads[order.id] || [];

                  return (
                    <Card key={order.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-display flex items-center gap-2">
                              <FileText className="w-5 h-5 text-primary" />
                              Pedido de {order.created_at && formatDate(order.created_at)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Total: {formatPrice(order.total_price)}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                            Pago
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {digitalItems.map((item) => {
                            const download = orderDownloads.find(d => d.product_id === item.product_id);
                            const remaining = download ? getRemainingDownloads(download) : 0;
                            const expired = download ? isExpired(download) : false;
                            const exhausted = remaining != null ? remaining <= 0 : false;
                            const disabled = !download || expired || exhausted;

                            return (
                              <div 
                                key={item.id} 
                                className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30"
                              >
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {item.products?.image_url ? (
                                    <img 
                                      src={item.products.image_url} 
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FileText className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.product_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {!download ? (
                                      'Processando...'
                                    ) : expired ? (
                                      <span className="text-destructive">Link expirado</span>
                                    ) : exhausted ? (
                                      <span className="text-destructive">Downloads esgotados</span>
                                    ) : (
                                      remaining == null
                                        ? 'Downloads ilimitados'
                                        : `${remaining} downloads restantes`
                                    )}
                                  </p>
                                </div>
                                
                                <Button 
                                  size="sm"
                                  disabled={disabled || (download && downloadingId === download.id)}
                                  onClick={() => download && handleDownload(download)}
                                  className="flex-shrink-0"
                                >
                                  {download && downloadingId === download.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : disabled ? (
                                    <AlertCircle className="w-4 h-4" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyOrders;
