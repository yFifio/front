import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, AlertCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paymentStatus = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const { clearCart } = useCart();

  const [paymentInfo, setPaymentInfo] = useState<{ order_status?: string; latest_webhook?: { mercado_pago_status?: string; mercado_pago_id?: string; payer_email?: string; amount?: number } } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    clearCart();

    if (orderId) {
      fetchPaymentStatus();
      const interval = setInterval(fetchPaymentStatus, 3000);
      const timeout = setTimeout(() => clearInterval(interval), 30000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [clearCart, orderId]);

  const fetchPaymentStatus = async () => {
    try {
      if (!orderId) return;
      
      const data = await apiRequest(`/orders/${orderId}/payment-status`);
      setPaymentInfo(data);

      if (data?.latest_webhook?.mercado_pago_status === 'approved' && data?.order_status === 'pending') {
        await apiRequest(`/orders/${orderId}/mark-paid`, { method: 'POST' }).catch(console.error);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPaymentStatus();
    setIsRefreshing(false);
    toast.success('Status atualizado!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const mpStatus = paymentInfo?.latest_webhook?.mercado_pago_status || paymentStatus;
  const orderStatus = paymentInfo?.order_status;
  const isApproved = mpStatus === 'approved' || orderStatus === 'paid';
  const isPending = mpStatus === 'pending';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center shadow-playful">
        <CardHeader>
          {isApproved ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : isPending ? (
            <Clock className="w-16 h-16 text-yellow-500 animate-pulse mx-auto mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <CardTitle className="text-2xl font-display">
            {isApproved && 'Pagamento Aprovado ✅'}
            {isPending && 'Processando Pagamento ⏳'}
            {!isApproved && !isPending && 'Erro no Pagamento ❌'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Pedido #</p>
              <p className="text-lg font-bold text-primary">{orderId}</p>
            </div>
          )}

          {paymentInfo?.latest_webhook && (
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-left space-y-2">
              <p className="text-sm font-medium">Detalhes do Pagamento:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  <strong>Status:</strong> {paymentInfo.latest_webhook.mercado_pago_status}
                </li>
                {paymentInfo.latest_webhook.mercado_pago_id && (
                  <li>
                    <strong>ID:</strong> {paymentInfo.latest_webhook.mercado_pago_id}
                  </li>
                )}
                {paymentInfo.latest_webhook.payer_email && (
                  <li>
                    <strong>Email:</strong> {paymentInfo.latest_webhook.payer_email}
                  </li>
                )}
                <li>
                  <strong>Valor:</strong> R$ {paymentInfo.latest_webhook.amount?.toFixed(2)}
                </li>
              </ul>
            </div>
          )}

          {isApproved && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-200">
                Obrigado pela sua compra! Seu pedido foi processado com sucesso.
              </p>
            </div>
          )}
          
          {isPending && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                Seu pagamento está sendo processado. Pode levar alguns momentos.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {!isApproved && (
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar Status
                  </>
                )}
              </Button>
            )}
            <Button onClick={() => navigate('/')} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Loja
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

};

export default OrderSuccess;
