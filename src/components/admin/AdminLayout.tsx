import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  X,
  Loader2,
  Home,
  Megaphone,
  Search,
  Bell,
  Settings,
  User,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
  { href: '/admin/products', label: 'Produtos', icon: Package, color: 'text-orange-500' },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart, color: 'text-green-500' },
  { href: '/admin/popups', label: 'Popups', icon: Megaphone, color: 'text-purple-500' },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
    }

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth', { state: { from: location.pathname } });
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <span className="text-6xl mb-4">🔒</span>
        <h1 className="text-2xl font-bold font-display mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Você não tem permissão para acessar o painel administrativo.
        </p>
        <Button onClick={() => navigate('/')}>
          <Home className="w-4 h-4 mr-2" />
          Voltar para a Loja
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50/50 flex font-display">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-2 border-purple-100 shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen rounded-r-3xl lg:rounded-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b-2 border-dashed border-purple-100">
            <h1 className="font-bold text-3xl text-primary flex items-center gap-2">
              <span className="text-4xl animate-bounce-gentle">🎪</span>
              Admin
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-2 bg-purple-100/50 px-3 py-1 rounded-full inline-block">
              Biblioteca do Brincar
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-8 px-6 space-y-8">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">
                Menu Principal
              </h3>
              <nav className="space-y-3">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105" 
                          : "text-muted-foreground hover:bg-purple-50 hover:text-primary hover:scale-105"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl bg-white/20 transition-colors",
                        isActive ? "text-white" : item.color
                      )}>
                        <item.icon className={cn(
                          "w-5 h-5 transition-transform duration-300",
                          isActive ? "scale-110" : "group-hover:rotate-12"
                        )} />
                      </div>
                      <span className="font-bold">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-3 w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">
                Sistema
              </h3>
              <nav className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-4 h-auto rounded-2xl text-muted-foreground hover:text-primary hover:bg-purple-50 hover:scale-105 transition-all duration-300"
                >
                  <div className="p-2 rounded-xl bg-gray-100 mr-3 group-hover:bg-white transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="font-bold">Configurações</span>
                </Button>
              </nav>
            </div>
          </div>

          <div className="p-6 border-t-2 border-dashed border-purple-100 bg-purple-50/50">
            <div className="flex items-center gap-4 mb-4 px-2">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary font-bold border-2 border-purple-100">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">Administrador</p>
                <p className="text-xs text-muted-foreground truncate">admin@biblioteca.com</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-white hover:bg-destructive hover:border-destructive rounded-xl border-2 border-destructive/20 transition-all duration-300 font-bold"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair do Sistema
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        <header className="h-24 border-b-2 border-purple-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
            
            <div className="relative hidden md:block max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
              <Input 
                placeholder="O que você procura hoje? 🔍" 
                className="pl-12 h-12 bg-purple-50/50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl transition-all duration-300 placeholder:text-muted-foreground/70" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 rounded-xl hover:bg-purple-50 text-primary font-bold">
                <Home className="w-4 h-4" />
                Ver Loja
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-purple-50 text-primary">
              <Bell className="w-6 h-6" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-white animate-pulse" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
