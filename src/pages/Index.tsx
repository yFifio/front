import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { HeroSection } from '@/components/store/HeroSection';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CartSheet } from '@/components/store/CartSheet';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import type { Product } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const productsRef = useRef<HTMLDivElement>(null);
  const [cartOpen, setCartOpen] = useState(false);
  
  const { data: products, isLoading } = useProducts('coloring_book');
  
  const { 
    items, 
    addItem, 
    updateQuantity, 
    removeItem, 
    getTotalItems, 
    getTotalPrice,
  } = useCart();

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho! 🎉`);
  };

  const handleExplore = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio!');
      return;
    }
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen">
      <HeroSection 
        onExplore={handleExplore}
        cartItemsCount={getTotalItems()}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main ref={productsRef} className="container py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold font-display text-foreground">
              Nossos Livros para Colorir ✨
            </h2>
            <p className="text-muted-foreground mt-1">
              Escolha os melhores desenhos para seus pequenos artistas
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/auth')}
              title="Minha Conta"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <ProductGrid 
          products={products}
          isLoading={isLoading}
          onAddToCart={handleAddToCart}
        />
      </main>
      
      <footer className="bg-muted py-8 mt-12">
        <div className="container text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Aventuras para Colorir - Livros Digitais para Pintura Infantil
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Feito com 💜 para pequenos artistas
          </p>
        </div>
      </footer>
      
      <CartSheet 
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
        totalPrice={getTotalPrice()}
      />
    </div>
  );
};

export default Index;
