import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

type ResourceType = 'suppliers' | 'categories' | 'coupons';

type Supplier = { id: number; name: string; email?: string };
type Category = { id: number; name: string };
type Coupon = { id: number; code: string; discount: number };

type ResourceItem = Supplier | Category | Coupon;

const labels: Record<ResourceType, string> = {
  suppliers: 'Fornecedores',
  categories: 'Categorias de Livros',
  coupons: 'Cupons',
};

function isResourceType(value?: string): value is ResourceType {
  return value === 'suppliers' || value === 'categories' || value === 'coupons';
}

export default function OperationsListPage() {
  const navigate = useNavigate();
  const { resource } = useParams();
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const resourceType = useMemo(() => (isResourceType(resource) ? resource : null), [resource]);

  const fetchItems = async () => {
    if (!resourceType) return;
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const data = await apiRequest(`/${resourceType}?limit=${limit}&offset=${offset}`);
      setItems(Array.isArray(data) ? data : data.data || []);
      setTotal(Array.isArray(data) ? data.length : Number(data.total || 0));
    } catch (error) {
      toast.error('Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [resourceType, page]);

  const handleDelete = async (id: number) => {
    if (!resourceType) return;
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await apiRequest(`/${resourceType}/${id}`, { method: 'DELETE' });
      toast.success('Removido com sucesso');
      fetchItems();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  if (!resourceType) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">Recurso inválido.</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">{labels[resourceType]}</h1>
          <p className="text-muted-foreground">Listagem com paginação (CRUD por rotas)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <Button onClick={() => navigate(`/admin/operations/${resourceType}/new`)}>
            <Plus className="w-4 h-4 mr-2" /> Novo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Nenhum item encontrado.</p>
          ) : (
            <div className="space-y-3">
              {resourceType === 'suppliers' && (items as Supplier[]).map((item) => (
                <div key={item.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.email || '-'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => navigate(`/admin/operations/${resourceType}/edit/${item.id}`)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}

              {resourceType === 'categories' && (items as Category[]).map((item) => (
                <div key={item.id} className="flex items-center justify-between border rounded p-3">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => navigate(`/admin/operations/${resourceType}/edit/${item.id}`)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}

              {resourceType === 'coupons' && (items as Coupon[]).map((item) => (
                <div key={item.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <p className="font-medium">{item.code}</p>
                    <p className="text-sm text-muted-foreground">{item.discount}% OFF</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => navigate(`/admin/operations/${resourceType}/edit/${item.id}`)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
