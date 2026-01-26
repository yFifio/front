import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import type { Product } from '@/types';

interface DigitalFile {
  id: string;
  file_name: string;
  file_path: string;
}

const productSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  description: z.string().trim().max(1000, 'Descrição muito longa').optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  category: z.enum(['digital', 'physical']),
  age_range: z.string().trim().max(50, 'Faixa etária muito longa').optional(),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  is_active: z.boolean(),
});

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [category, setCategory] = useState<'digital' | 'physical'>(product?.category || 'digital');
  const [ageRange, setAgeRange] = useState(product?.age_range || '');
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [digitalFiles, setDigitalFiles] = useState<DigitalFile[]>([]);

  // Fetch existing digital files for the product
  const { data: existingFiles } = useQuery({
    queryKey: ['digital-files', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from('digital_files')
        .select('id, file_name, file_path')
        .eq('product_id', product.id);
      if (error) throw error;
      return data as DigitalFile[];
    },
    enabled: !!product?.id,
  });

  // Sync existing files to state
  useEffect(() => {
    if (existingFiles) {
      setDigitalFiles(existingFiles);
    }
  }, [existingFiles]);

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof productSchema>) => {
      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            description: data.description || null,
            price: data.price,
            category: data.category,
            age_range: data.age_range || null,
            image_url: data.image_url || null,
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            name: data.name,
            description: data.description || null,
            price: data.price,
            category: data.category,
            age_range: data.age_range || null,
            image_url: data.image_url || null,
            is_active: data.is_active,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEditing ? 'Produto atualizado!' : 'Produto criado!');
      onSuccess();
    },
    onError: (error) => {
      toast.error('Erro ao salvar produto: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      description: description || undefined,
      price: parseFloat(price) || 0,
      category,
      age_range: ageRange || undefined,
      image_url: imageUrl || undefined,
      is_active: isActive,
    };

    try {
      const validated = productSchema.parse(data);
      mutation.mutate(validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Livro de Animais para Colorir"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o produto..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="29.90"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as 'digital' | 'physical')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="digital">📱 Digital</SelectItem>
              <SelectItem value="physical">📦 Físico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age_range">Faixa Etária</Label>
        <Input
          id="age_range"
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          placeholder="Ex: 3-6 anos"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">URL da Imagem</Label>
        <Input
          id="image_url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
        />
        {imageUrl && (
          <div className="mt-2 aspect-video max-w-xs bg-muted rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Digital Files Upload - only show for digital products */}
      {category === 'digital' && (
        <div className="border rounded-lg p-4">
          <FileUpload
            productId={product?.id}
            existingFiles={digitalFiles}
            onFilesChange={setDigitalFiles}
            disabled={mutation.isPending}
          />
        </div>
      )}

      <div className="flex items-center justify-between border rounded-lg p-4">
        <div>
          <Label htmlFor="is_active">Produto Ativo</Label>
          <p className="text-sm text-muted-foreground">
            Produtos inativos não aparecem na loja
          </p>
        </div>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
        </Button>
      </div>
    </form>
  );
}
