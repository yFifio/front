import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { HeroSection } from '@/components/store/HeroSection';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CartSheet } from '@/components/store/CartSheet';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { PopupManager } from '@/components/store/PopupManager';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Package } from 'lucide-react';
import type { Product } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const productsRef = useRef<HTMLDivElement>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'digital' | 'physical'>('digital');
  const [selectedBookCategory, setSelectedBookCategory] = useState<string>('all');
  
  const { data: digitalProducts, isLoading: isLoadingDigital } = useProducts('digital');
  const { data: physicalProducts, isLoading: isLoadingPhysical } = useProducts('physical');
  
  const { 
    items, 
    addItem, 
    updateQuantity, 
    removeItem, 
    syncProducts,
    getTotalItems, 
    getTotalPrice,
  } = useCart();

  const currentProducts = activeTab === 'digital' ? digitalProducts : physicalProducts;
  const currentLoading = activeTab === 'digital' ? isLoadingDigital : isLoadingPhysical;

  const availableBookCategories = Array.from(
    new Set((currentProducts || []).map((p) => p.book_category).filter(Boolean) as string[])
  );

  useEffect(() => {
    setSelectedBookCategory('all');
  }, [activeTab]);

  useEffect(() => {
    const merged = [...(digitalProducts || []), ...(physicalProducts || [])];
    if (merged.length) {
      syncProducts(merged);
    }
  }, [digitalProducts, physicalProducts, syncProducts]);

  const filteredProducts = (currentProducts || []).filter((product) => {
    if (selectedBookCategory === 'all') return true;
    return product.book_category === selectedBookCategory;
  });

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
      
      <main ref={productsRef} className="container py-8 md:py-12 px-4">
        <div className="mb-6 md:mb-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'digital' | 'physical')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 md:h-12">
              <TabsTrigger value="digital" className="flex items-center gap-1 md:gap-2 text-sm md:text-base px-2 md:px-6">
                <Smartphone className="w-4 h-4" />
                <span>Digitais</span>
              </TabsTrigger>
              <TabsTrigger value="physical" className="flex items-center gap-1 md:gap-2 text-sm md:text-base px-2 md:px-6">
                <Package className="w-4 h-4" />
                <span>Físicos</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-6 md:mb-8 max-w-xs">
          <Select value={selectedBookCategory} onValueChange={setSelectedBookCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {availableBookCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {activeTab === 'digital' ? (
          <section>
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground flex items-center gap-2 md:gap-3">
                📱 Livros Digitais
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Receba instantaneamente após o pagamento! Imprima quantas vezes quiser.
              </p>
            </div>
            
            <ProductGrid 
              products={filteredProducts}
              isLoading={currentLoading}
              onAddToCart={handleAddToCart}
            />
          </section>
        ) : (
          <section>
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground flex items-center gap-2 md:gap-3">
                📦 Livros Físicos
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Entrega em todo o Brasil. Papel de alta qualidade para colorir.
              </p>
            </div>
            
            <ProductGrid 
              products={filteredProducts}
              isLoading={currentLoading}
              onAddToCart={handleAddToCart}
            />
          </section>
        )}
      </main>
      
      <footer className="bg-muted py-8 mt-12">
        <div className="container text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Biblioteca de Brincar - Livros para Pintura Infantil
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
      
      <WhatsAppButton 
        phoneNumber="+55 44 999992074"
        message="Olá! Preciso de ajuda com a loja de livros para colorir."
      />
      
      <PopupManager type="homepage" />
    </div>
  );
};

export default Index;
