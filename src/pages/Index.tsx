import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { HeroSection } from '@/components/store/HeroSection';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CartSheet } from '@/components/store/CartSheet';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Smartphone, Package } from 'lucide-react';
import type { Product } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const productsRef = useRef<HTMLDivElement>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'digital' | 'physical'>('digital');
  
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
      
      <main ref={productsRef} className="container py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'digital' | 'physical')} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 h-12">
              <TabsTrigger value="digital" className="flex items-center gap-2 text-base px-6">
                <Smartphone className="w-4 h-4" />
                Digitais
              </TabsTrigger>
              <TabsTrigger value="physical" className="flex items-center gap-2 text-base px-6">
                <Package className="w-4 h-4" />
                Físicos
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/auth')}
            title="Minha Conta"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
        
        {activeTab === 'digital' ? (
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
        ) : (
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
        )}
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
