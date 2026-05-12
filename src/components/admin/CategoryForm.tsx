import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

export function CategoryForm({
  item,
  onSuccess,
}: {
  item?: Category | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;
  const [name, setName] = useState(item?.name ?? '');

  useEffect(() => {
    setName(item?.name ?? '');
  }, [item]);

  const mutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const endpoint = isEditing ? `/categories/${item?.id}` : '/categories';
      const method = isEditing ? 'PUT' : 'POST';
      return await apiRequest(endpoint, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEditing ? 'Categoria atualizada!' : 'Categoria criada!');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar categoria: ' + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Nome da categoria é obrigatório');
    mutation.mutate({ name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da categoria</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar
        </Button>
      </div>
    </form>
  );
}
