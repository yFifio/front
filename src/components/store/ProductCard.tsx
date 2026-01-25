import { ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const categoryConfig = {
    ebook: {
      label: '🖍️ Para Colorir',
      bgClass: 'bg-coloring',
      textClass: 'text-coloring-foreground',
    },
    coloring_book: {
      label: '🎨 Para Colorir',
      bgClass: 'bg-coloring',
      textClass: 'text-coloring-foreground',
    },
  };

  const config = categoryConfig[product.category];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-playful hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{product.category === 'ebook' ? '📖' : '🖍️'}</span>
          </div>
        )}
        
        <Badge className={`absolute top-3 left-3 ${config.bgClass} ${config.textClass} font-bold`}>
          {config.label}
        </Badge>
        
        {product.age_range && (
          <Badge variant="secondary" className="absolute top-3 right-3 font-medium">
            {product.age_range}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 font-display">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className="w-4 h-4 text-coloring fill-coloring" 
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(Novo!)</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-2xl font-bold text-primary font-display">
          {formatPrice(product.price)}
        </span>
        
        <Button 
          onClick={() => onAddToCart(product)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-card hover:scale-105 transition-all"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
}
