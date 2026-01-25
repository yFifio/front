import { Book, Palette, ShoppingCart, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onExplore: () => void;
  cartItemsCount: number;
  onCartClick: () => void;
}

export function HeroSection({ onExplore, cartItemsCount, onCartClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 animate-float">
        <Star className="w-8 h-8 text-coloring opacity-80" fill="currentColor" />
      </div>
      <div className="absolute top-20 right-20 animate-bounce-gentle">
        <Sparkles className="w-10 h-10 text-primary-foreground opacity-70" />
      </div>
      <div className="absolute bottom-20 left-1/4 animate-wiggle">
        <Book className="w-12 h-12 text-ebook opacity-60" />
      </div>
      <div className="absolute bottom-10 right-1/3 animate-float" style={{ animationDelay: '1s' }}>
        <Palette className="w-9 h-9 text-coloring opacity-70" />
      </div>
      
      <div className="container relative z-10">
        <div className="flex justify-end mb-4">
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={onCartClick}
            className="shadow-playful hover:scale-105 transition-transform"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Carrinho
            {cartItemsCount > 0 && (
              <span className="ml-2 bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {cartItemsCount}
              </span>
            )}
          </Button>
        </div>
        
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 font-display">
            🎨 Aventuras para Colorir
            <br />
            <span className="text-coloring">Diversão Garantida!</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 font-body">
            Livros digitais para colorir e pintar que vão despertar 
            a criatividade dos pequenos artistas! 🖍️✨
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={onExplore}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-8 py-6 rounded-2xl shadow-playful hover:scale-105 transition-all"
            >
              <Palette className="w-5 h-5 mr-2" />
              Ver Livros para Colorir
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
