import { Heart, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-bold font-display mb-3">🎨 Biblioteca de Brincar</h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Livros para pintura infantil com amor e criatividade. Desenvolvendo arte e imaginação em cada página.
            </p>
            <div className="flex items-center gap-1 mt-4 text-primary-foreground/80 text-sm">
              <span>Feito com</span>
              <Heart className="w-4 h-4 fill-current text-red-300" />
              <span>para pequenos artistas</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-3">Links Rápidos</h4>
            <ul className="space-y-2 text-primary-foreground/80 text-sm">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-primary-foreground transition-colors">
                  🏠 Início
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/my-orders')} className="hover:text-primary-foreground transition-colors">
                  📦 Meus Pedidos
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/my-downloads')} className="hover:text-primary-foreground transition-colors">
                  ⬇️ Meus Downloads
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/auth')} className="hover:text-primary-foreground transition-colors">
                  🔐 Entrar / Cadastrar
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-3">Contato</h4>
            <ul className="space-y-3 text-primary-foreground/80 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+55 (44) 99999-2074</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>contato@bibliotecadebrincar.com.br</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 flex-shrink-0" />
                <a
                  href="https://instagram.com/bibliotecadebrincar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  @bibliotecadebrincar
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Brasil 🇧🇷</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-10 pt-6 text-center text-primary-foreground/60 text-xs">
          <p>© {year} Biblioteca de Brincar — Todos os direitos reservados.</p>
          <p className="mt-1">Pagamentos seguros processados pelo Mercado Pago 🔒</p>
        </div>
      </div>
    </footer>
  );
}
