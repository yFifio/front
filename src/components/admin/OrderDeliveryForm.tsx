import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Phone, Truck, Mail, Loader2, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getOrderStatusClassName, getOrderStatusLabel } from '@/lib/orderStatus';

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
  customerEmail: string;
  currentStatus?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  initialData: OrderDeliveryData;
  orderItems: Array<{ product_name: string; quantity: number | null }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDeliveryForm({
  orderId,
  customerName,
  customerEmail,
  currentStatus = 'pending',
  initialData,
  orderItems,
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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<'paid' | 'shipped' | 'delivered'>(
    currentStatus === 'delivered' ? 'delivered' : currentStatus === 'shipped' ? 'shipped' : 'paid'
  );

  const previousTrackingCode = initialData.tracking_code;

  const updateMutation = useMutation({
    mutationFn: async (data: OrderDeliveryData) => {
      return await apiRequest(`/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      
      const trackingCodeChanged = data.tracking_code && data.tracking_code !== previousTrackingCode;
      
      if (trackingCodeChanged) {
        setSendingEmail(true);
        try {
          await apiRequest(`/orders/${orderId}/tracking-email`, {
            method: 'POST',
            body: JSON.stringify({
              customerEmail,
              customerName,
              trackingCode: data.tracking_code,
              orderItems: orderItems.map(item => ({
                name: item.product_name,
                quantity: item.quantity || 1,
              })),
            }),
          });

          toast.success('Dados atualizados e email de rastreio enviado!');
        } catch (err) {
          console.error('Error invoking email function:', err);
          toast.warning('Dados salvos, mas houve erro ao enviar email');
        } finally {
          setSendingEmail(false);
        }
      } else {
        toast.success('Dados de entrega atualizados!');
      }
      
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: 'paid' | 'shipped' | 'delivered') => {
      return await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status de entrega atualizado!');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar status de entrega';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof OrderDeliveryData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
  };

  const getStatusVisual = (status: 'paid' | 'shipped' | 'delivered') => {
    if (status === 'paid') {
      return {
        label: getOrderStatusLabel('paid'),
        className: getOrderStatusClassName('paid'),
        icon: <CheckCircle className="w-3 h-3" />,
      };
    }

    if (status === 'shipped') {
      return {
        label: getOrderStatusLabel('shipped'),
        className: getOrderStatusClassName('shipped'),
        icon: <Truck className="w-3 h-3" />,
      };
    }

    return {
      label: getOrderStatusLabel('delivered'),
      className: getOrderStatusClassName('delivered'),
      icon: <CheckCircle className="w-3 h-3" />,
    };
  };

  const isLoading = updateMutation.isPending || sendingEmail;
  const isStatusLoading = statusMutation.isPending;
  const statusVisual = getStatusVisual(deliveryStatus);

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

          <div className="space-y-2 rounded-lg border p-3">
            <Label>Status de Entrega</Label>
            <div className="flex items-center gap-2">
              <Select
                value={deliveryStatus}
                onValueChange={(value) => setDeliveryStatus(value as 'paid' | 'shipped' | 'delivered')}
                disabled={isStatusLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                disabled={isStatusLoading}
                onClick={() => statusMutation.mutate(deliveryStatus)}
              >
                {isStatusLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar'
                )}
              </Button>
            </div>
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusVisual.className}`}>
                {statusVisual.icon}
                {statusVisual.label}
              </span>
            </div>
          </div>

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
              {formData.tracking_code && formData.tracking_code !== previousTrackingCode && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email será enviado ao cliente com este código
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {sendingEmail ? 'Enviando email...' : 'Salvando...'}
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
