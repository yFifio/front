import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplierForm } from '@/components/admin/SupplierForm';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { CouponForm } from '@/components/admin/CouponForm';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

type ResourceType = 'suppliers' | 'categories' | 'coupons';

type Supplier = { id: number; name: string; email?: string };
type Category = { id: number; name: string };
type Coupon = { id: number; code: string; discount: number };

type ResourceItem = Supplier | Category | Coupon;

const labels: Record<ResourceType, string> = {
  suppliers: 'Fornecedor',
  categories: 'Categoria',
  coupons: 'Cupom',
};

function isResourceType(value?: string): value is ResourceType {
  return value === 'suppliers' || value === 'categories' || value === 'coupons';
}

export default function OperationFormPage() {
  const navigate = useNavigate();
  const { resource, id } = useParams();
  const [item, setItem] = useState<ResourceItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resourceType = useMemo(() => (isResourceType(resource) ? resource : null), [resource]);

  useEffect(() => {
    const fetchItem = async () => {
      if (!resourceType || !id) return;
      setIsLoading(true);
      try {
        const found = await apiRequest(`/${resourceType}/${id}`);
        setItem(found as ResourceItem);
      } catch {
        toast.error('Erro ao carregar dados');
        navigate(`/admin/operations/${resourceType}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [resourceType, id, navigate]);

  if (!resourceType) {
    return <div className="container mx-auto p-6 text-destructive">Recurso inválido.</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEditing = Boolean(id);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-2xl">
      <Button variant="outline" onClick={() => navigate(`/admin/operations/${resourceType}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Editar' : 'Novo'} {labels[resourceType]}</CardTitle>
        </CardHeader>
        <CardContent>
          {resourceType === 'suppliers' && (
            <SupplierForm
              item={(item as Supplier | null) || null}
              onSuccess={() => navigate(`/admin/operations/${resourceType}`)}
            />
          )}

          {resourceType === 'categories' && (
            <CategoryForm
              item={(item as Category | null) || null}
              onSuccess={() => navigate(`/admin/operations/${resourceType}`)}
            />
          )}

          {resourceType === 'coupons' && (
            <CouponForm
              item={(item as Coupon | null) || null}
              onSuccess={() => navigate(`/admin/operations/${resourceType}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
