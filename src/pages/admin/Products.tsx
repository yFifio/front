import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';
import type { Product } from '@/types';

export default function Products() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      // First, try to delete related records that we can safely remove
      // Delete product images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);
      
      // Delete digital files
      await supabase
        .from('digital_files')
        .delete()
        .eq('product_id', productId);
      
      // Now try to delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído com sucesso!');
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      // Check if error is due to foreign key constraint (product has orders)
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        toast.error(
          'Este produto tem pedidos associados e não pode ser excluído. Use o botão "Desativar" para ocultá-lo da loja.',
          { duration: 5000 }
        );
      } else {
        toast.error('Erro ao excluir produto: ' + error.message);
      }
      setDeletingProduct(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto desativado! Não aparecerá mais na loja.');
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast.error('Erro ao desativar produto: ' + error.message);
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seus livros para colorir</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-video mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge variant={product.category === 'digital' ? 'default' : 'secondary'}>
                    {product.category === 'digital' ? '📱 Digital' : '📦 Físico'}
                  </Badge>
                  {!product.is_active && (
                    <Badge variant="destructive">Inativo</Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {product.description || 'Sem descrição'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary text-lg">
                    {formatPrice(product.price)}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingProduct(product)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando seu primeiro livro para colorir!
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Produto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={editingProduct} 
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ou Desativar Produto</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>O que deseja fazer com "<strong>{deletingProduct?.name}</strong>"?</p>
              <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
                <p><strong>🗑️ Excluir:</strong> Remove permanentemente. Só funciona se não houver pedidos.</p>
                <p><strong>🚫 Desativar:</strong> Oculta da loja, mas mantém histórico de pedidos.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => deletingProduct && deactivateMutation.mutate(deletingProduct.id)}
            >
              🚫 Desativar
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
            >
              🗑️ Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
