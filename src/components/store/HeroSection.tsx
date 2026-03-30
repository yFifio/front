import { motion } from 'framer-motion';
import { Book, Palette, ShoppingCart, Star, Sparkles, User, Settings, Package, Download } from 'lucide-react';
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.24),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(244,114,182,0.24),transparent_30%)] opacity-90" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-200/15"
        animate={{ rotate: -360, scale: [1, 1.04, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />

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
                <DropdownMenuItem onClick={() => navigate('/my-downloads')}>
                  <Download className="w-4 h-4 mr-2" />
                  Meus Downloads
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
            onClick={() => navigate('/colorir-loja')}
            className="shadow-playful hover:scale-105 transition-transform text-xs md:text-sm"
          >
            <Palette className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Colorir Loja</span>
            <span className="sm:hidden">Colorir</span>
          </Button>
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
        
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="grid items-center gap-10"
          >
            <div className="text-center">
              <h1 className="text-3xl font-black text-primary-foreground sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display leading-tight">
                📚 Biblioteca de Brincar
              </h1>

              <p className="mt-3 text-2xl font-black uppercase tracking-[0.18em] text-prismatic psychedelic-text md:text-4xl lg:text-5xl">
                colorir, imaginar e brincar
              </p>

              <p className="mb-6 mt-5 max-w-2xl text-base text-primary-foreground/90 md:text-lg lg:text-xl font-body mx-auto">
                Livros digitais e físicos para colorir com uma vitrine cheia de glow, profundidade e energia visual para despertar a criatividade dos pequenos artistas. 🖍️✨
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button 
                  size="lg" 
                  onClick={onExplore}
                  className="group bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-2xl shadow-playful hover:scale-105 transition-all"
                >
                  <Palette className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  Ver Livros para Colorir
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
