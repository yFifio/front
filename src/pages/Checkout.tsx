import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, ShoppingBag, CreditCard } from 'lucide-react';
import { z } from 'zod';
import DeliveryAddressForm from '@/components/checkout/DeliveryAddressForm';

const checkoutSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState('');
  
  // Delivery address fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  // Check if cart has physical products
  const hasPhysicalProducts = useMemo(() => {
    return items.some(item => item.product.category === 'physical');
  }, [items]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

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
      checkoutSchema.parse({ email, name });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    // Validate delivery address for physical products
    if (hasPhysicalProducts) {
      if (!deliveryAddress || !deliveryCity || !deliveryState || !deliveryZip || !deliveryPhone) {
        toast.error('Preencha todos os campos de endereço para produtos físicos');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id || null,
          customer_email: email,
          customer_name: name,
          total_price: getTotalPrice(),
          status: 'pending',
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        price_at_purchase: item.product.price,
        quantity: item.quantity,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Call edge function to create Mercado Pago payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-mercado-pago-payment',
        {
          body: {
            orderId: order.id,
            items: items.map(item => ({
              title: item.product.name,
              quantity: item.quantity,
              unit_price: item.product.price,
            })),
            payer: {
              email: email,
              name: name,
            },
            // Include delivery address for physical products
            ...(hasPhysicalProducts && {
              deliveryAddress: {
                address: deliveryAddress,
                city: deliveryCity,
                state: deliveryState,
                zip: deliveryZip,
                phone: deliveryPhone,
              },
            }),
          },
        }
      );
      
      if (paymentError) throw paymentError;
      
      if (paymentData?.init_point) {
        // Use init_point for production payments
        clearCart();
        window.location.href = paymentData.init_point;
      } else {
        throw new Error('Erro ao criar pagamento');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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
          {/* Order Summary */}
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
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg font-display">Total:</span>
                <span className="font-bold text-2xl text-primary font-display">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Checkout Form */}
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
                
                {/* Delivery Address Form - Only for physical products */}
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
                
                <Button 
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6 rounded-xl shadow-playful"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Pagar {formatPrice(getTotalPrice())}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
