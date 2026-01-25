import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { clearCart } = useCart();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clearCart();
    
    if (orderId) {
      const fetchDownloads = async () => {
        const { data } = await supabase
          .from('downloads')
          .select('*, products:product_id(name, category)')
          .eq('order_id', orderId);
        
        if (data) setDownloads(data);
        setIsLoading(false);
      };
      
      setTimeout(fetchDownloads, 2000); // Wait for webhook
    } else {
      setIsLoading(false);
    }
  }, [orderId, clearCart]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center shadow-playful">
        <CardHeader>
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
          <CardTitle className="text-2xl font-display">Compra Realizada! 🎉</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Obrigado pela sua compra! Seus downloads estarão disponíveis em breve.
          </p>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : downloads.length > 0 ? (
            <div className="space-y-2">
              {downloads.map((d) => (
                <Button key={d.id} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  {d.products?.name || 'Download'}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Você receberá um email com os links de download.
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
