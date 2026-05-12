import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Coupon {
  id: number;
  code: string;
  discount: number;
}

export function CouponForm({
  item,
  onSuccess,
}: {
  item?: Coupon | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;
  const [code, setCode] = useState(item?.code ?? '');
  const [discount, setDiscount] = useState(item?.discount ?? 0);

  const mutation = useMutation({
    mutationFn: async (data: { code: string; discount: number }) => {
      const endpoint = isEditing ? `/coupons/${item?.id}` : '/coupons';
      const method = isEditing ? 'PUT' : 'POST';
      return await apiRequest(endpoint, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success(isEditing ? 'Atualizado!' : 'Criado!');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar: ' + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return toast.error('Código é obrigatório');
    mutation.mutate({ code: code.trim(), discount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Código</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Desconto (%)</Label>
        <Input
          type="number"
          step="0.01"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          required
        />
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
