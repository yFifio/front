import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-4 select-none">🎨</div>
        <h1 className="text-7xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-bold font-display mb-3">Página não encontrada</h2>
        <p className="text-muted-foreground mb-2">
          Ops! Parece que essa página voou junto com os pincéis...
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          O endereço <code className="bg-background px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> não existe.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="w-4 h-4" />
            Ir para a loja
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
