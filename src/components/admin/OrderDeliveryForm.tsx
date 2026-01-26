import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Phone, Truck } from 'lucide-react';

interface OrderDeliveryData {
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip: string | null;
  delivery_phone: string | null;
  tracking_code: string | null;
}

interface OrderDeliveryFormProps {
  orderId: string;
  customerName: string | null;
  initialData: OrderDeliveryData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDeliveryForm({
  orderId,
  customerName,
  initialData,
  open,
  onOpenChange,
}: OrderDeliveryFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<OrderDeliveryData>({
    delivery_address: initialData.delivery_address || '',
    delivery_city: initialData.delivery_city || '',
    delivery_state: initialData.delivery_state || '',
    delivery_zip: initialData.delivery_zip || '',
    delivery_phone: initialData.delivery_phone || '',
    tracking_code: initialData.tracking_code || '',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OrderDeliveryData) => {
      const { error } = await supabase
        .from('orders')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Dados de entrega atualizados!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof OrderDeliveryData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Dados de Entrega
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cliente: <span className="font-medium text-foreground">{customerName || 'N/A'}</span>
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="delivery_address">Endereço</Label>
              <Input
                id="delivery_address"
                placeholder="Rua, número, complemento"
                value={formData.delivery_address || ''}
                onChange={(e) => handleChange('delivery_address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="delivery_city">Cidade</Label>
                <Input
                  id="delivery_city"
                  placeholder="Cidade"
                  value={formData.delivery_city || ''}
                  onChange={(e) => handleChange('delivery_city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="delivery_state">Estado</Label>
                <Input
                  id="delivery_state"
                  placeholder="UF"
                  maxLength={2}
                  value={formData.delivery_state || ''}
                  onChange={(e) => handleChange('delivery_state', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="delivery_zip">CEP</Label>
                <Input
                  id="delivery_zip"
                  placeholder="00000-000"
                  value={formData.delivery_zip || ''}
                  onChange={(e) => handleChange('delivery_zip', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="delivery_phone" className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Telefone
                </Label>
                <Input
                  id="delivery_phone"
                  placeholder="(00) 00000-0000"
                  value={formData.delivery_phone || ''}
                  onChange={(e) => handleChange('delivery_phone', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tracking_code" className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Código de Rastreio
              </Label>
              <Input
                id="tracking_code"
                placeholder="Código dos Correios ou transportadora"
                value={formData.tracking_code || ''}
                onChange={(e) => handleChange('tracking_code', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
