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
import { User } from 'lucide-react';
import type { Product } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const productsRef = useRef<HTMLDivElement>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [category, setCategory] = useState<'all' | 'ebook' | 'coloring_book'>('all');
  
  const { data: products, isLoading } = useProducts(
    category === 'all' ? undefined : category
  );
  
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
              Nossos Produtos ✨
            </h2>
            <p className="text-muted-foreground mt-1">
              Escolha os melhores conteúdos para seus pequenos
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <TabsList className="bg-muted">
                <TabsTrigger value="all" className="font-medium">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="ebook" className="font-medium">
                  📚 Ebooks
                </TabsTrigger>
                <TabsTrigger value="coloring_book" className="font-medium">
                  🎨 Colorir
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
            © 2024 Aventuras Mágicas - Ebooks e Livros de Colorir Infantis
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Feito com 💜 para pequenos leitores
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
