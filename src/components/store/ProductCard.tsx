import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductDetailModal } from './ProductDetailModal';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -8, rotateX: 2.5, rotateY: -2.5, scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 230, damping: 18 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Card 
          className={`group glass-panel psychedelic-border overflow-hidden border-2 transition-all duration-300 hover:shadow-playful cursor-pointer ${
            product.is_featured 
              ? 'border-accent ring-2 ring-accent/30' 
              : 'border-border/60 hover:border-primary/50'
          }`}
          onClick={handleCardClick}
        >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),linear-gradient(135deg,rgba(217,70,239,0.12),transparent_30%,rgba(34,211,238,0.12))] opacity-80" />
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
        
        {product.is_featured && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground font-bold animate-pulse">
            <Sparkles className="w-3 h-3 mr-1" />
            Destaque
          </Badge>
        )}
        
        {!product.is_featured && (
          <Badge className={`absolute top-3 left-3 ${config.bgClass} ${config.textClass} font-bold`}>
            {config.label}
          </Badge>
        )}
        
        {hasDiscount && (
          <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground font-bold text-sm">
            -{product.discount_percent}%
          </Badge>
        )}
        
        {!hasDiscount && product.age_range && (
          <Badge variant="secondary" className="absolute top-3 right-3 font-medium">
            {product.age_range}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3 md:p-4">
        <h3 className="font-bold text-base md:text-lg text-foreground mb-2 line-clamp-2 font-display leading-tight">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-muted-foreground text-xs md:text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <p className="text-xs md:text-sm text-muted-foreground mb-3">
          <span className="font-semibold text-foreground">Categoria:</span>{' '}
          {product.book_category?.trim() || 'Sem categoria'}
        </p>
        
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className="w-3 h-3 md:w-4 md:h-4 text-coloring fill-coloring" 
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(Novo!)</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 md:p-4 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-col">
          {hasDiscount ? (
            <>
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
              <span className="text-xl md:text-2xl font-bold text-destructive font-display">
                {formatPrice(discountedPrice)}
              </span>
            </>
          ) : (
            <span className="text-xl md:text-2xl font-bold text-primary font-display">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        
        <Button 
          onClick={handleAddToCartClick}
          size="sm"
          className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-card hover:scale-105 transition-all text-xs md:text-sm"
        >
          <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          Adicionar
        </Button>
      </CardFooter>
        </Card>
      </motion.div>

    <ProductDetailModal
      product={product}
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      onAddToCart={onAddToCart}
    />
  </>
  );
}
