import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { CartItem } from '@/types';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  totalPrice: number;
}

export function CartSheet({
  open,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  totalPrice,
}: CartSheetProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Seu Carrinho
          </SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🛒</span>
            <h3 className="font-bold text-lg mb-2 font-display">Carrinho vazio!</h3>
            <p className="text-muted-foreground text-sm">
              Adicione alguns produtos incríveis para começar.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <Card key={item.product.id} className="border-border">
                  <CardContent className="p-4">
                    {(() => {
                      const itemDiscount = item.product.discount_percent || 0;
                      const discountedUnitPrice = item.product.price * (1 - itemDiscount / 100);
                      const hasDiscount = itemDiscount > 0;

                      return (
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.product.image_url ? (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">
                            {item.product.category === 'digital' ? '📱' : '📦'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm line-clamp-2 font-display">
                          {item.product.name}
                        </h4>
                        {hasDiscount ? (
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(item.product.price)}
                            </p>
                            <p className="text-primary font-bold">
                              {formatPrice(discountedUnitPrice)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-primary font-bold mt-1">
                            {formatPrice(item.product.price)}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onRemoveItem(item.product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg font-display">Total:</span>
                <span className="font-bold text-2xl text-primary font-display">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6 rounded-xl shadow-playful hover:scale-[1.02] transition-all"
                onClick={onCheckout}
              >
                Pagar {formatPrice(totalPrice)}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
