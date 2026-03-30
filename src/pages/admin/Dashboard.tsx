import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type DashboardOrder = {
  id: string | number;
  customer_name?: string | null;
  customerName?: string | null;
  customer_email?: string | null;
  customerEmail?: string | null;
  total_price?: number;
  totalPrice?: number;
  status?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

type DashboardStats = {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
};

const EMPTY_STATS: DashboardStats = {
  totalOrders: 0,
  paidOrders: 0,
  totalRevenue: 0,
};

const FINANCIALLY_CONFIRMED_STATUSES = new Set(['paid', 'shipped', 'delivered']);

const isFinanciallyConfirmed = (status: string | null | undefined) => {
  if (!status) return false;
  return FINANCIALLY_CONFIRMED_STATUSES.has(String(status).toLowerCase());
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const {
    data: stats = EMPTY_STATS,
    isLoading: isStatsLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const ordersData = await apiRequest('/orders');

      const orders: DashboardOrder[] = Array.isArray(ordersData)
        ? ordersData
        : (ordersData?.data || ordersData?.rows || ordersData?.orders || []);

      const totalOrders = orders.length;
      const paidOrders = orders.filter((order) => isFinanciallyConfirmed(order.status)).length;
      const totalRevenue = orders
        .filter((order) => isFinanciallyConfirmed(order.status))
        .reduce((sum, order) => sum + Number(order.total_price ?? order.totalPrice ?? 0), 0);

      return { totalOrders, paidOrders, totalRevenue };
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const {
    data: totalProducts = 0,
    isLoading: isProductsLoading,
    isFetching: isFetchingProducts,
    refetch: refetchProducts,
  } = useQuery<number>({
    queryKey: ['admin-products-count'],
    queryFn: async () => {
      const productsData = await apiRequest('/products?limit=200');
      const products = Array.isArray(productsData)
        ? productsData
        : (productsData?.data || productsData?.rows || productsData?.products || []);
      return products.length;
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const {
    data: recentOrders = [],
    isLoading: ordersLoading,
    isFetching: isFetchingRecentOrders,
    dataUpdatedAt: recentOrdersUpdatedAt,
    refetch: refetchRecentOrders,
  } = useQuery<DashboardOrder[]>({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const response = await apiRequest('/orders');
      const orders: DashboardOrder[] = Array.isArray(response)
        ? response
        : (response?.data || response?.rows || response?.orders || []);

      return orders
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || '').getTime();
          const dateB = new Date(b.created_at || b.createdAt || '').getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const lastUpdatedAt = recentOrdersUpdatedAt
    ? new Date(recentOrdersUpdatedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-products-count'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] }),
      ]);
      await Promise.all([refetch(), refetchProducts(), refetchRecentOrders()]);
      toast.success('Dashboard atualizado');
    } catch (error) {
      toast.error('Não foi possível atualizar o dashboard');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      delivered: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Pago',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
        {lastUpdatedAt && (
          <p className="text-xs text-muted-foreground mt-1">Última atualização: {lastUpdatedAt}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleRefresh}
          disabled={isManualRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(isFetching || isFetchingProducts || isFetchingRecentOrders || isManualRefreshing) ? 'animate-spin' : ''}`} />
          Atualizar agora
        </Button>
      </div>

      {isError && (
        <Card>
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Não foi possível carregar os indicadores do dashboard.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isProductsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{totalProducts}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Confirmados
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-green-600">{stats.paidOrders}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-primary">
                {formatPrice(stats.totalRevenue)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-2"
                >
                  <div>
                    <p className="font-medium">{order.customer_name || order.customerName || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email || order.customerEmail || '-'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary">
                      {formatPrice(Number(order.total_price ?? order.totalPrice ?? 0))}
                    </span>
                    {getStatusBadge(order.status || 'pending')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at || order.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum pedido ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
