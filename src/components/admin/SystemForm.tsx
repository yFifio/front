import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface SystemItem {
  id: number;
  name: string;
  type: 'A' | 'B' | 'C';
}

export function SystemForm({
  item,
  type,
  onSuccess,
}: {
  item?: SystemItem | null;
  type: 'A' | 'B' | 'C';
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;
  const [name, setName] = useState(item?.name ?? '');

  const mutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const endpoint = isEditing ? `/systems/${item?.id}` : '/systems';
      const method = isEditing ? 'PUT' : 'POST';
      return await apiRequest(endpoint, { method, body: JSON.stringify({ ...data, type }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems', type] });
      toast.success(isEditing ? 'Atualizado!' : 'Criado!');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar: ' + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Nome é obrigatório');
    mutation.mutate({ name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
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
