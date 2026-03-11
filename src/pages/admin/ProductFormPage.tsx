import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(!!id); 

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const data = await apiRequest(`/products/${id}`);
          setProduct(data as Product);
        } catch (error) {
          toast.error('Erro ao carregar produto.');
          navigate('/admin');
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, navigate]);

  const handleSuccess = () => {
    navigate('/admin'); 
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div>
        <h1 className="text-3xl font-bold font-display">
          {id ? 'Editar Produto' : 'Novo Produto'}
        </h1>
        <p className="text-muted-foreground">
          Preencha os dados do produto abaixo.
        </p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        <ProductForm product={product} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}