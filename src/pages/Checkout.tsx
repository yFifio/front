import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';

import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'TEST-0afb0cce-be7f-49f0-a8a4-61b51c6e57bf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, ShoppingBag, CreditCard } from 'lucide-react';
import { z } from 'zod';
import DeliveryAddressForm from '@/components/checkout/DeliveryAddressForm';
import { PopupManager } from '@/components/store/PopupManager';

const checkoutSchema = z.object({
  email: z.string().email('Formato de e-mail inválido'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cpf: z.string().min(11, 'Formato de CPF inválido').max(14, 'Formato de CPF inválido'),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  useEffect(() => {
    if (MP_PUBLIC_KEY) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
    } else {
      console.warn('⚠️ VITE_MERCADOPAGO_PUBLIC_KEY não configurada.');
    }
  }, []);

  const hasPhysicalProducts = useMemo(() => {
    return items.some(item => item.product.category === 'physical');
  }, [items]);

  const subtotal = useMemo(() => getTotalPrice(), [getTotalPrice, items]);
  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Number(((subtotal * appliedCoupon.discount) / 100).toFixed(2));
  }, [subtotal, appliedCoupon]);
  const finalTotal = useMemo(() => Number(Math.max(0, subtotal - couponDiscountAmount).toFixed(2)), [subtotal, couponDiscountAmount]);

  const getEffectiveUnitPrice = (item: (typeof items)[number]) => {
    const itemDiscount = item.product.discount_percent || 0;
    return Number((item.product.price * (1 - itemDiscount / 100)).toFixed(2));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <span className="text-6xl mb-4">🔐</span>
        <h1 className="text-2xl font-bold font-display mb-2">Login necessário</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Você precisa estar logado para finalizar sua compra.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => navigate('/auth')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <span className="text-6xl mb-4">🛒</span>
        <h1 className="text-2xl font-bold font-display mb-2">Carrinho vazio!</h1>
        <p className="text-muted-foreground mb-6">
          Adicione alguns produtos antes de fazer o checkout.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a loja
        </Button>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      checkoutSchema.parse({ email, name, cpf });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (hasPhysicalProducts) {
      if (!deliveryAddress || !deliveryCity || !deliveryState || !deliveryZip || !deliveryPhone) {
        toast.error('Preencha todos os campos de endereço para produtos físicos');
        return;
      }
    }

    setIsLoading(true);
    setPaymentError(null);

    try {
      const payload: {
        items: Array<{ productId: string; productName: string; price: number; quantity: number }>;
        customerEmail: string;
        customerName: string;
        customerCpf: string;
        customerId: number | null;
        totalPrice: number;
        couponCode?: string;
        deliveryAddress?: { address: string; city: string; state: string; zip: string; phone: string };
      } = {
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          price: getEffectiveUnitPrice(item),
          quantity: item.quantity,
        })),
        customerEmail: email,
        customerName: name,
        customerCpf: cpf,
        customerId: user?.id || null,
        totalPrice: finalTotal,
        couponCode: appliedCoupon?.code || undefined,
      };
      if (hasPhysicalProducts) {
        payload.deliveryAddress = {
          address: deliveryAddress,
          city: deliveryCity,
          state: deliveryState,
          zip: deliveryZip,
          phone: deliveryPhone,
        };
      }

      const data = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data?.mode === 'mock') {
        toast.info('🧪 Modo TESTE: Simulando pagamento aprovado...');
        await new Promise(r => setTimeout(r, 1500));
        
        clearCart();
        if (data?.warning) {
          toast.error('⚠️ ' + data.warning);
        }
        navigate(`/order-success?order_id=${data.orderId}`);
        return;
      }

      if (data?.preference_id) {
        setOrderId(data.orderId);
        setPreferenceId(data.preference_id);
        toast.success('Preferência criada! Complete o pagamento.');
        return;
      }

      if (data?.init_point) {
        window.location.href = data.init_point;
        return;
      }

      if (data?.orderId) {
        clearCart();
        if (data?.warning) {
          toast.error('⚠️ ' + data.warning);
        }
        navigate(`/order-success?order_id=${data.orderId}`);
        return;
      }

      throw new Error('Erro ao criar pedido');
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar pedido. Tente novamente.';
      setPaymentError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async () => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      toast.error('Digite um código de cupom');
      return;
    }
    try {
      const data = await apiRequest('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: normalized }),
      });
      setAppliedCoupon({ code: data.code, discount: Number(data.discount || 0) });
      setPreferenceId(null);
      setOrderId(null);
      toast.success(`Cupom ${data.code} aplicado (${data.discount}% OFF)`);
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error instanceof Error ? error.message : 'Cupom inválido');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setPreferenceId(null);
    setOrderId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-display">Finalizar Compra</h1>
        </div>
      </header>
      
      <main className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.product.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">
                        {item.product.category === 'digital' ? '📱' : '📦'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                    <p className="text-muted-foreground text-xs">Qtd: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-primary">
                    {formatPrice(getEffectiveUnitPrice(item) * item.quantity)}
                  </span>
                </div>
              ))}
              
              <Separator />

              <div className="space-y-3">
                <Label htmlFor="coupon">Cupom de desconto</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    type="text"
                    placeholder="Ex: LIVRO10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Button type="button" variant="outline" onClick={applyCoupon}>
                    Aplicar
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>Cupom aplicado: <strong>{appliedCoupon.code}</strong> ({appliedCoupon.discount}%)</span>
                    <Button type="button" variant="ghost" onClick={removeCoupon}>Remover</Button>
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Subtotal:</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Desconto ({appliedCoupon.discount}%):</span>
                  <span>- {formatPrice(couponDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-bold text-lg font-display">Total final:</span>
                <span className="font-bold text-2xl text-primary font-display">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <CreditCard className="w-5 h-5 text-primary" />
                Seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {hasPhysicalProducts 
                      ? 'Preencha o endereço de entrega abaixo para produtos físicos.'
                      : 'Você receberá o link de download neste email após a confirmação do pagamento.'}
                  </p>
                </div>
                
                {hasPhysicalProducts && (
                  <DeliveryAddressForm
                    address={deliveryAddress}
                    setAddress={setDeliveryAddress}
                    city={deliveryCity}
                    setCity={setDeliveryCity}
                    state={deliveryState}
                    setState={setDeliveryState}
                    zip={deliveryZip}
                    setZip={setDeliveryZip}
                    phone={deliveryPhone}
                    setPhone={setDeliveryPhone}
                  />
                )}
                
                <Separator />
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png" 
                      alt="Mercado Pago"
                      className="w-8 h-8"
                    />
                    <span className="font-medium">Pagamento via Mercado Pago</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pague com cartão de crédito, débito, Pix ou boleto. 
                    Ambiente 100% seguro.
                  </p>
                </div>

                {paymentError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Erro no pagamento:</p>
                    <p className="text-xs text-red-500 dark:text-red-300 mt-1">{paymentError}</p>
                  </div>
                )}
                
                <Button 
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6 rounded-xl shadow-playful"
                  disabled={isLoading || !!preferenceId}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : preferenceId ? (
                    <>Aguarde o Wallet...✈️</>
                  ) : (
                    <>
                      Pagar {formatPrice(finalTotal)}
                    </>
                  )}
                </Button>
              </form>

              {preferenceId && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
                    👇 Finalize o pagamento usando o botão do Mercado Pago abaixo:
                  </p>
                  {MP_PUBLIC_KEY ? (
                    <Wallet key={preferenceId} initialization={{ preferenceId }} />
                  ) : (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      ⚠️ Chave pública do Mercado Pago não configurada. Redirecionando...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <PopupManager type="funnel" />
    </div>
  );
};

export default Checkout;
