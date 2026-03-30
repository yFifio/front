import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { SingleImageUpload } from '@/components/admin/SingleImageUpload';
import { PdfUpload } from '@/components/admin/PdfUpload';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/types';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  description: z.string().trim().max(1000, 'Descrição muito longa').optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  category: z.enum(['digital', 'physical']),
  categoryId: z.number().int().positive().nullable().optional(),
  book_category: z.string().trim().max(100, 'Categoria do livro muito longa').optional(),
  image_url: z.string().optional(),
  pdf_url: z.string().nullable().optional(),
  pdf_file_name: z.string().nullable().optional(),
  age_range: z.string().trim().max(50, 'Faixa etária muito longa').optional(),
  is_active: z.coerce.boolean(),
  discount_percent: z.number().min(0).max(100).default(0),
  is_featured: z.coerce.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm({ product, onSuccess }: { product?: Product | null, onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price ? String(product.price) : '');
  const [category, setCategory] = useState<'digital' | 'physical'>(product?.category === 'physical' ? 'physical' : 'digital');
  const [categoryId, setCategoryId] = useState<string>(product?.categoryId ? String(product.categoryId) : 'none');
  const [bookCategory, setBookCategory] = useState(product?.book_category ?? '');
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [ageRange, setAgeRange] = useState(product?.age_range ?? '');
  const [isActive, setIsActive] = useState(Boolean(product?.is_active ?? true));
  const [discountPercent, setDiscountPercent] = useState(product?.discount_percent ? String(product.discount_percent) : '0');
  const [isFeatured, setIsFeatured] = useState(Boolean(product?.is_featured ?? false));
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [pdfUrl, setPdfUrl] = useState(product?.pdf_url ?? '');
  const [pdfFileName, setPdfFileName] = useState(product?.pdf_file_name ?? '');

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const endpoint = isEditing ? `/products/${product.id}` : `/products`;
      const method = isEditing ? 'PUT' : 'POST';
      return await apiRequest(endpoint, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isEditing ? 'Produto atualizado!' : 'Produto criado!');
      onSuccess();
    },
    onError: (error: Error) => toast.error('Erro ao salvar produto: ' + error.message),
  });

  useEffect(() => {
    setName(product?.name ?? '');
    setDescription(product?.description ?? '');
    setPrice(product?.price ? String(product.price) : '');
    setCategory(product?.category === 'physical' ? 'physical' : 'digital');
    const currentCategoryId = (product?.categoryId ?? (product as unknown as { category_id?: number | null })?.category_id) ?? null;
    setCategoryId(currentCategoryId ? String(currentCategoryId) : 'none');
    setBookCategory(product?.book_category ?? '');
    setAgeRange(product?.age_range ?? '');
    setIsActive(Boolean(product?.is_active ?? true));
    setDiscountPercent(product?.discount_percent ? String(product.discount_percent) : '0');
    setIsFeatured(Boolean(product?.is_featured ?? false));
    setImageUrl(product?.image_url ?? '');
    setPdfUrl(product?.pdf_url ?? '');
    setPdfFileName(product?.pdf_file_name ?? '');
  }, [product]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiRequest('/categories?limit=1000&offset=0');
        const list = Array.isArray(data) ? data : data?.data || data?.rows || [];
        setAvailableCategories(list);
      } catch {
        setAvailableCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(String(price).replace(',', '.'));
    const data = {
      name,
      description,
      price: numericPrice || 0,
      category,
      categoryId: categoryId === 'none' ? null : Number(categoryId),
      book_category: bookCategory || undefined,
      image_url: imageUrl,
      pdf_url: category === 'digital' ? (pdfUrl || null) : null,
      pdf_file_name: category === 'digital' ? (pdfFileName || null) : null,
      age_range: ageRange,
      is_active: isActive, discount_percent: parseInt(discountPercent) || 0, is_featured: isFeatured,
    };

    try {
      const validated = productSchema.parse(data);
      mutation.mutate(validated);
    } catch (err) {
      if (err instanceof z.ZodError) toast.error(err.errors[0].message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label>Nome do Produto *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div className="space-y-2"><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Preço (R$) *</Label><Input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
        <div className="space-y-2">
          <Label>Formato *</Label>
          <Select value={category} onValueChange={(v: 'digital' | 'physical') => setCategory(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="digital">📱 Digital</SelectItem><SelectItem value="physical">📦 Físico</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Categoria (relacionamento)</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem categoria</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Categoria de Livro</Label>
        <Select value={bookCategory || 'none'} onValueChange={(v) => setBookCategory(v === 'none' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem categoria</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Imagem do Produto</Label>
        <SingleImageUpload 
          currentImage={imageUrl} 
          onImageChange={(url) => setImageUrl(url || '')} 
        />
      </div>

      {category === 'digital' && (
        <div className="space-y-2">
          <Label>Arquivo PDF do Livro</Label>
          <PdfUpload
            currentPdf={pdfUrl}
            currentFileName={pdfFileName}
            onPdfChange={({ url, fileName }) => {
              setPdfUrl(url || '');
              setPdfFileName(fileName || '');
            }}
          />
          <p className="text-xs text-muted-foreground">
            Importe o PDF do livro digital para liberar o download após a compra.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
        </Button>
      </div>
    </form>
  );
}