import { useState } from 'react';
import { ShoppingCart, Star, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { Product } from '@/types';

interface ProductDetailModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductDetailModal({ 
  product, 
  open, 
  onOpenChange, 
  onAddToCart 
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const categoryConfig = {
    digital: {
      label: '📱 Digital',
      description: 'Receba instantaneamente após o pagamento! Imprima quantas vezes quiser.',
      bgClass: 'bg-primary',
      textClass: 'text-primary-foreground',
    },
    physical: {
      label: '📦 Físico',
      description: 'Entrega em todo o Brasil. Papel de alta qualidade para colorir.',
      bgClass: 'bg-accent',
      textClass: 'text-accent-foreground',
    },
  };

  const config = categoryConfig[product.category];

  const hasDiscount = product.discount_percent && product.discount_percent > 0;
  const discountedPrice = hasDiscount 
    ? product.price * (1 - (product.discount_percent || 0) / 100) 
    : product.price;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const images = product.images || [];
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.display_order - b.display_order;
  });

  const hasMultipleImages = sortedImages.length > 1;
  const currentImage = sortedImages[currentImageIndex]?.image_url || product.image_url;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleAddToCart = () => {
    onAddToCart(product);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl lg:max-w-7xl p-0 overflow-hidden max-h-[95vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>{product.name}</DialogTitle>
        </VisuallyHidden>
        
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 z-50 h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm md:hidden"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative w-full h-full bg-muted">
            {currentImage ? (
              <img 
                src={currentImage} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[300px]">
                <span className="text-8xl">{product.category === 'digital' ? '📱' : '📦'}</span>
              </div>
            )}
            
            {hasMultipleImages && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-2">
                {sortedImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-primary scale-110' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img.image_url} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {product.is_featured && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground font-bold text-sm px-3 py-1">
                <Sparkles className="w-4 h-4 mr-1" />
                Destaque
              </Badge>
            )}

            {hasDiscount && (
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground font-bold text-lg px-3 py-1">
                -{product.discount_percent}%
              </Badge>
            )}
          </div>

          <div className="p-4 md:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={`${config.bgClass} ${config.textClass} font-bold`}>
                {config.label}
              </Badge>
              {product.age_range && (
                <Badge variant="outline" className="font-medium">
                  {product.age_range}
                </Badge>
              )}
            </div>

            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground font-display mb-4 leading-tight">
              {product.name}
            </h2>

            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className="w-5 h-5 text-coloring fill-coloring" 
                />
              ))}
              <span className="text-sm text-muted-foreground ml-2">(Novo!)</span>
            </div>

            <div className="flex-1 mb-6">
              {product.description ? (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  {config.description}
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                {product.category === 'digital' ? (
                  <>
                    <span className="font-semibold text-foreground">📧 Entrega Digital:</span>{' '}
                    Você receberá o link de download por email imediatamente após a confirmação do pagamento.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">🚚 Entrega Física:</span>{' '}
                    Enviamos para todo o Brasil. Prazo de entrega varia conforme sua região.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
              <div className="flex flex-col">
                {hasDiscount ? (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-destructive font-display">
                      {formatPrice(discountedPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl md:text-3xl font-bold text-primary font-display">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              
              <Button 
                size="lg"
                onClick={handleAddToCart}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-playful hover:scale-105 transition-all px-6 md:px-8 text-sm md:text-base"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
