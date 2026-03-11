import { Book, Palette, ShoppingCart, Star, Sparkles, User, Settings, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeroSectionProps {
  onExplore: () => void;
  cartItemsCount: number;
  onCartClick: () => void;
}

export function HeroSection({ onExplore, cartItemsCount, onCartClick }: HeroSectionProps) {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  console.log('🔍 Depuração de admin:', { user, isAdmin, userIsAdmin: user?.isAdmin });

  return (
    <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
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
        <div className="flex flex-wrap justify-center md:justify-end mb-4 gap-2">
          {(isAdmin || user?.isAdmin) && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/admin')}
              className="shadow-playful hover:scale-105 transition-transform text-xs md:text-sm"
            >
              <Settings className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="shadow-playful hover:scale-105 transition-transform text-xs md:text-sm"
                >
                  <User className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Minha Conta</span>
                  <span className="sm:hidden">Conta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                  <Package className="w-4 h-4 mr-2" />
                  Meus Pedidos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="shadow-playful hover:scale-105 transition-transform text-xs md:text-sm"
            >
              <User className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Entrar / Cadastrar</span>
              <span className="sm:hidden">Entrar</span>
            </Button>
          )}
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onCartClick}
            className="shadow-playful hover:scale-105 transition-transform text-xs md:text-sm"
          >
            <ShoppingCart className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Carrinho</span>
            {cartItemsCount > 0 && (
              <span className="ml-1 md:ml-2 bg-accent text-accent-foreground rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold">
                {cartItemsCount}
              </span>
            )}
          </Button>
        </div>
        
        <div className="text-center max-w-3xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 md:mb-6 font-display leading-tight">
            📚 Biblioteca de Brincar
            <br />
            <span className="text-coloring">Diversão Garantida!</span>
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-primary-foreground/90 mb-6 md:mb-8 font-body">
            Livros digitais para colorir e pintar que vão despertar 
            a criatividade dos pequenos artistas! 🖍️✨
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={onExplore}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-2xl shadow-playful hover:scale-105 transition-all"
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
