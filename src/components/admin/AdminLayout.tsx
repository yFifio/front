import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  Settings,
  LogOut, 
  Menu, 
  Loader2,
  Home,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/operations', label: 'Operações', icon: Settings },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
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
    <div className="min-h-screen bg-background flex font-display">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-lg transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen rounded-r-3xl lg:rounded-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-border">
            <h1 className="font-bold text-3xl text-primary flex items-center gap-2">
              <span className="text-4xl animate-bounce-gentle">🎪</span>
              Admin
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-2 bg-muted px-3 py-1 rounded-full inline-block">
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
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-primary"
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
                <Link
                  to="/admin/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 text-muted-foreground hover:text-accent-foreground hover:bg-accent hover:scale-105"
                >
                  <div className="p-2 rounded-xl bg-muted transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="font-bold">Configurações</span>
                </Link>
              </nav>
            </div>
          </div>

          <div className="p-6 border-t border-border bg-muted/30">
            <div className="flex items-center gap-4 mb-4 px-2">
              <div className="w-12 h-12 rounded-2xl bg-background shadow-sm flex items-center justify-center text-primary font-bold border border-border">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{user.nome || 'Administrador'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email || '-'}</p>
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
        <header className="h-24 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 rounded-xl hover:bg-accent text-foreground font-bold">
                <Home className="w-4 h-4" />
                Ver Loja
              </Button>
            </Link>
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
