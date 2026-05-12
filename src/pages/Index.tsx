import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { HeroSection } from '@/components/store/HeroSection';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CartSheet } from '@/components/store/CartSheet';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { Footer } from '@/components/store/Footer';
import { PsychedelicExperience } from '@/components/store/PsychedelicExperience';
import { ScrollToTopButton } from '@/components/store/ScrollToTopButton';
import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Package, Search, Star } from 'lucide-react';
import type { Product } from '@/types';
import { apiRequest } from '@/lib/api';

const Index = () => {
  const navigate = useNavigate();
  const productsRef = useRef<HTMLDivElement>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'digital' | 'physical'>('digital');
  const [selectedBookCategory, setSelectedBookCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: digitalProducts, isLoading: isLoadingDigital } = useProducts('digital');
  const { data: physicalProducts, isLoading: isLoadingPhysical } = useProducts('physical');
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => apiRequest('/categories') as Promise<{ data?: Array<{ name?: string | null }> } | Array<{ name?: string | null }>>,
  });
  
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

  const categoriesFromApi = (Array.isArray(categoriesResponse)
    ? categoriesResponse
    : categoriesResponse?.data || [])
    .map((item) => item?.name?.trim())
    .filter((name): name is string => Boolean(name));

  const categoriesFromProducts = (currentProducts || [])
    .map((product) => product.book_category?.trim())
    .filter((category): category is string => Boolean(category));

  const availableBookCategories = Array.from(new Set([...categoriesFromApi, ...categoriesFromProducts]));

  useEffect(() => {
    setSelectedBookCategory('all');
    setSearchQuery('');
  }, [activeTab]);

  const featuredProducts = [
    ...(digitalProducts || []).filter((p) => p.is_featured),
    ...(physicalProducts || []).filter((p) => p.is_featured),
  ];

  useEffect(() => {
    const merged = [...(digitalProducts || []), ...(physicalProducts || [])];
    if (merged.length) {
      syncProducts(merged);
    }
  }, [digitalProducts, physicalProducts, syncProducts]);

  const filteredProducts = (currentProducts || []).filter((product) => {
    const matchesCategory = selectedBookCategory === 'all' || product.book_category === selectedBookCategory;
    const matchesSearch = !searchQuery.trim() || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
    <div className="min-h-screen relative">
      <HeroSection 
        onExplore={handleExplore}
        cartItemsCount={getTotalItems()}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main ref={productsRef} className="container relative py-8 md:py-12 px-4">
        <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.12),transparent_28%)] blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <PsychedelicExperience />
        </motion.div>

        {featuredProducts.length > 0 && (
          <section className="mb-10 rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-xl font-bold font-display">Em Destaque</h2>
              <Badge variant="secondary" className="ml-1">{featuredProducts.length}</Badge>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="glass-panel flex-shrink-0 snap-start w-44 md:w-52 rounded-2xl overflow-hidden border border-white/10 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
                  onClick={() => handleAddToCart(product)}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_28%),linear-gradient(135deg,rgba(34,211,238,0.14),transparent_32%,rgba(244,114,182,0.18))]" />
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
                    )}
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">⭐ Destaque</div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold line-clamp-2 leading-tight">{product.name}</p>
                    <p className="text-primary font-bold text-sm mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mb-5 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produtos..."
            className="pl-9 glass-panel border-white/10"
          />
        </div>

        <div className="mb-6 md:mb-8 glass-panel rounded-[1.75rem] border border-white/10 p-3 md:p-4">
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
                {searchQuery && <Badge variant="secondary" className="text-base font-normal">{filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}</Badge>}
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
                {searchQuery && <Badge variant="secondary" className="text-base font-normal">{filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}</Badge>}
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
      
      <Footer />
      
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

      <ScrollToTopButton />
    </div>
  );
};

export default Index;
