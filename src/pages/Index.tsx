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
  
  const { data: digitalProducts, isLoading: isLoadingDigital } = useProducts('digital');
  const { data: physicalProducts, isLoading: isLoadingPhysical } = useProducts('physical');
  
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
      
      <main ref={productsRef} className="container py-12 space-y-16">
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/auth')}
            title="Minha Conta"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Seção Digital */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
              📱 Livros Digitais
            </h2>
            <p className="text-muted-foreground mt-2">
              Receba instantaneamente após o pagamento! Imprima quantas vezes quiser.
            </p>
          </div>
          
          <ProductGrid 
            products={digitalProducts}
            isLoading={isLoadingDigital}
            onAddToCart={handleAddToCart}
          />
        </section>
        
        {/* Seção Física */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
              📦 Livros Físicos
            </h2>
            <p className="text-muted-foreground mt-2">
              Entrega em todo o Brasil. Papel de alta qualidade para colorir.
            </p>
          </div>
          
          <ProductGrid 
            products={physicalProducts}
            isLoading={isLoadingPhysical}
            onAddToCart={handleAddToCart}
          />
        </section>
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
