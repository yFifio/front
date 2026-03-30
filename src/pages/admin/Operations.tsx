import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Tags, TicketPercent, ArrowRight } from 'lucide-react';

const operationItems = [
  {
    title: 'Fornecedores',
    description: 'Gerencie parceiros editoriais e contatos comerciais.',
    to: '/admin/operations/suppliers',
    icon: Building2,
  },
  {
    title: 'Categorias de Livros',
    description: 'Organize o catálogo por categorias para facilitar a busca.',
    to: '/admin/operations/categories',
    icon: Tags,
  },
  {
    title: 'Cupons',
    description: 'Crie e acompanhe campanhas promocionais da loja.',
    to: '/admin/operations/coupons',
    icon: TicketPercent,
  },
];

export default function Operations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Operações</h1>
        <p className="text-muted-foreground">Acesse os módulos operacionais da loja</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {operationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="border-2 hover:border-primary/40 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to={item.to}>
                    Abrir módulo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
