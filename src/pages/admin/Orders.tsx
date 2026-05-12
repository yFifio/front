import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Package, Truck, CheckCircle, Clock, XCircle, Smartphone, FileText, MapPin } from 'lucide-react';
import { OrderDeliveryForm } from '@/components/admin/OrderDeliveryForm';
import { apiRequest } from '@/lib/api';
import {
  ALL_ORDER_STATUS_OPTIONS,
  NON_SHIPPING_ORDER_STATUS_OPTIONS,
  getOrderStatusClassName,
  getOrderStatusLabel,
  normalizeOrderStatus,
} from '@/lib/orderStatus';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number | null;
  price_at_purchase: number;
  product_id: string | null;
  products: {
    category: string | null;
  } | null;
}

interface Order {
  id: string;
  customer_name: string | null;
  customer_email: string;
  total_price: number;
  status: string | null;
  created_at: string | null;
  order_items: OrderItem[];
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip: string | null;
  delivery_phone: string | null;
  tracking_code: string | null;
}

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false);
  const [deliveryEditOrder, setDeliveryEditOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'physical' | 'digital'>('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const data = await apiRequest('/orders');
      const list = Array.isArray(data) ? data : data?.data || data?.rows || data?.orders || [];
      return list as Order[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      
      return { orderId, status };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
      toast.error('Erro ao atualizar: ' + message);
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    const normalized = normalizeOrderStatus(status);
    const statusMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      pending: { 
        label: getOrderStatusLabel('pending'), 
        icon: <Clock className="w-3 h-3" />, 
        color: getOrderStatusClassName('pending'), 
      },
      paid: { 
        label: getOrderStatusLabel('paid'), 
        icon: <CheckCircle className="w-3 h-3" />, 
        color: getOrderStatusClassName('paid'), 
      },
      shipped: { 
        label: getOrderStatusLabel('shipped'), 
        icon: <Truck className="w-3 h-3" />, 
        color: getOrderStatusClassName('shipped'), 
      },
      delivered: { 
        label: getOrderStatusLabel('delivered'), 
        icon: <CheckCircle className="w-3 h-3" />, 
        color: getOrderStatusClassName('delivered'), 
      },
      cancelled: { 
        label: getOrderStatusLabel('cancelled'), 
        icon: <XCircle className="w-3 h-3" />, 
        color: getOrderStatusClassName('cancelled'), 
      },
    };
    return statusMap[normalized] || statusMap.pending;
  };

  const getStatusBadge = (status: string) => {
    const info = getStatusInfo(status);
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
        {info.icon}
        {info.label}
      </span>
    );
  };

  const hasPhysicalItems = (order: Order) => {
    return order.order_items?.some(item => item.products?.category === 'physical');
  };

  const hasDigitalItems = (order: Order) => {
    return order.order_items?.some(item => item.products?.category === 'digital');
  };

  const getOrderType = (order: Order): 'physical' | 'digital' | 'mixed' => {
    const hasPhysical = hasPhysicalItems(order);
    const hasDigital = hasDigitalItems(order);
    if (hasPhysical && hasDigital) return 'mixed';
    if (hasPhysical) return 'physical';
    return 'digital';
  };

  const filteredOrders = orders?.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'physical') return hasPhysicalItems(order);
    if (activeTab === 'digital') return hasDigitalItems(order);
    return true;
  });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    updateStatusMutation.mutate({ orderId: order.id, status: newStatus });
  };

  const getAvailableStatuses = (order: Order) => {
    const orderType = getOrderType(order);
    
    if (orderType === 'digital') {
      return NON_SHIPPING_ORDER_STATUS_OPTIONS;
    }
    
    return ALL_ORDER_STATUS_OPTIONS;
  };

  const getOrderTypeIcon = (order: Order) => {
    const type = getOrderType(order);
    if (type === 'physical') return <Package className="w-4 h-4 text-muted-foreground" />;
    if (type === 'digital') return <Smartphone className="w-4 h-4 text-muted-foreground" />;
    return (
      <div className="flex gap-0.5">
        <Package className="w-3 h-3 text-muted-foreground" />
        <Smartphone className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  };

  const physicalCount = orders?.filter(hasPhysicalItems).length || 0;
  const digitalCount = orders?.filter(hasDigitalItems).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie os pedidos e status de entrega</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'physical' | 'digital')}>
        <TabsList>
          <TabsTrigger value="all">
            Todos ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="physical" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Físicos ({physicalCount})
          </TabsTrigger>
          <TabsTrigger value="digital" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Digitais ({digitalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const orderType = getOrderType(order);
                const availableStatuses = getAvailableStatuses(order);

                return (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getOrderTypeIcon(order)}
                            <p className="font-bold">{order.customer_name || 'Cliente'}</p>
                            {getStatusBadge(order.status || 'pending')}
                          </div>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {order.created_at && formatDate(order.created_at)}
                            </p>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {orderType === 'physical' ? 'Físico' : orderType === 'digital' ? 'Digital' : 'Misto'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary text-lg">
                            {formatPrice(Number(order.total_price))}
                          </span>
                          
                          <Select 
                            value={order.status || 'pending'}
                            onValueChange={(value) => handleStatusChange(order, value)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {hasPhysicalItems(order) && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setDeliveryEditOrder(order);
                                setIsDeliveryFormOpen(true);
                              }}
                              title="Editar dados de entrega"
                            >
                              <MapPin className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {hasPhysicalItems(order) && order.status !== 'pending' && order.status !== 'cancelled' && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              ['paid', 'shipped', 'delivered'].includes(order.status || '') 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Package className="w-3 h-3" />
                            </div>
                            <div className={`flex-1 h-1 rounded ${
                              ['shipped', 'delivered'].includes(order.status || '') 
                                ? 'bg-primary' 
                                : 'bg-muted'
                            }`} />
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              ['shipped', 'delivered'].includes(order.status || '') 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Truck className="w-3 h-3" />
                            </div>
                            <div className={`flex-1 h-1 rounded ${
                              order.status === 'delivered' 
                                ? 'bg-primary' 
                                : 'bg-muted'
                            }`} />
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              order.status === 'delivered' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <CheckCircle className="w-3 h-3" />
                            </div>
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>Preparando</span>
                            <span>Enviado</span>
                            <span>Entregue</span>
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
                <p className="text-muted-foreground">
                  Os pedidos aparecerão aqui quando os clientes comprarem.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes do Pedido
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm break-all">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {selectedOrder.created_at && formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.status || 'pending')}
                </div>
              </div>

              {hasPhysicalItems(selectedOrder) && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Dados de Entrega
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeliveryEditOrder(selectedOrder);
                        setIsDeliveryFormOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                  <div className="bg-muted rounded p-3 text-sm space-y-1">
                    {selectedOrder.delivery_address ? (
                      <>
                        <p>{selectedOrder.delivery_address}</p>
                        <p>
                          {selectedOrder.delivery_city}
                          {selectedOrder.delivery_state && ` - ${selectedOrder.delivery_state}`}
                        </p>
                        {selectedOrder.delivery_zip && <p>CEP: {selectedOrder.delivery_zip}</p>}
                        {selectedOrder.delivery_phone && <p>Tel: {selectedOrder.delivery_phone}</p>}
                        {selectedOrder.tracking_code && (
                          <p className="font-medium text-primary">
                            Rastreio: {selectedOrder.tracking_code}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhum dado de entrega cadastrado
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <p className="font-bold mb-2">Itens do Pedido</p>
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {item.products?.category === 'physical' ? (
                            <Package className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qtd: {item.quantity || 1} • {item.products?.category === 'physical' ? 'Físico' : 'Digital'}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-sm">
                          {formatPrice(Number(item.price_at_purchase))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum item encontrado</p>
                )}
              </div>
              
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-xl text-primary">
                  {formatPrice(Number(selectedOrder.total_price))}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {deliveryEditOrder && (
        <OrderDeliveryForm
          orderId={deliveryEditOrder.id}
          customerName={deliveryEditOrder.customer_name}
          customerEmail={deliveryEditOrder.customer_email}
          currentStatus={(deliveryEditOrder.status || 'pending') as 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'}
          orderItems={deliveryEditOrder.order_items}
          initialData={{
            delivery_address: deliveryEditOrder.delivery_address,
            delivery_city: deliveryEditOrder.delivery_city,
            delivery_state: deliveryEditOrder.delivery_state,
            delivery_zip: deliveryEditOrder.delivery_zip,
            delivery_phone: deliveryEditOrder.delivery_phone,
            tracking_code: deliveryEditOrder.tracking_code,
          }}
          open={isDeliveryFormOpen}
          onOpenChange={(open) => {
            setIsDeliveryFormOpen(open);
            if (!open) setDeliveryEditOrder(null);
          }}
        />
      )}
    </div>
  );
}
