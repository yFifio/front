import { useState } from 'react';
import { ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const categoryConfig = {
    digital: {
      label: '📱 Digital',
      bgClass: 'bg-primary',
      textClass: 'text-primary-foreground',
    },
    physical: {
      label: '📦 Físico',
      bgClass: 'bg-accent',
      textClass: 'text-accent-foreground',
    },
  };

  const config = categoryConfig[product.category];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Get sorted images with primary first
  const images = product.images || [];
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.display_order - b.display_order;
  });

  const hasMultipleImages = sortedImages.length > 1;
  const currentImage = sortedImages[currentImageIndex]?.image_url || product.image_url;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <Card className="group overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-playful hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {currentImage ? (
          <img 
            src={currentImage} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{product.category === 'digital' ? '📱' : '📦'}</span>
          </div>
        )}
        
        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              onClick={handlePrevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Image Dots Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex 
                      ? 'bg-primary' 
                      : 'bg-background/60 hover:bg-background'
                  }`}
                />
              ))}
            </div>
          </>
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
