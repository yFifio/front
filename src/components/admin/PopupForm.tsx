import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SingleImageUpload } from './SingleImageUpload';
import type { Popup, PopupFormData } from '@/types/popup';
import { Loader2 } from 'lucide-react';

const popupSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().nullable(),
  image_url: z.string().nullable(),
  button_text: z.string().nullable(),
  button_link: z.string().nullable(),
  popup_type: z.enum(['homepage', 'funnel']),
  is_active: z.boolean(),
  discount_percent: z.number().min(0).max(100).nullable(),
  display_delay_seconds: z.number().min(0),
  show_on_exit_intent: z.boolean(),
});

interface PopupFormProps {
  popup?: Popup;
  defaultType?: 'homepage' | 'funnel';
  onSubmit: (data: PopupFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PopupForm({ popup, defaultType = 'homepage', onSubmit, onCancel, isLoading }: PopupFormProps) {
  const [imageUrl, setImageUrl] = useState(popup?.image_url || '');

  const form = useForm<PopupFormData>({
    resolver: zodResolver(popupSchema),
    defaultValues: {
      title: popup?.title || '',
      content: popup?.content || '',
      image_url: popup?.image_url || null,
      button_text: popup?.button_text || 'Ver Oferta',
      button_link: popup?.button_link || '',
      popup_type: popup?.popup_type || defaultType,
      is_active: popup?.is_active ?? true,
      discount_percent: popup?.discount_percent || null,
      display_delay_seconds: popup?.display_delay_seconds || 3,
      show_on_exit_intent: popup?.show_on_exit_intent || false,
    },
  });

  const handleSubmit = async (data: PopupFormData) => {
    await onSubmit({
      ...data,
      image_url: imageUrl || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Popup</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Oferta Especial! 🎉" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição da oferta ou mensagem..." 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Imagem do Popup</Label>
          <SingleImageUpload
            onImageChange={(url) => setImageUrl(url || '')}
            currentImage={imageUrl}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="button_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto do Botão</FormLabel>
                <FormControl>
                  <Input placeholder="Ver Oferta" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="button_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link do Botão</FormLabel>
                <FormControl>
                  <Input placeholder="/checkout ou URL externa" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="popup_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Popup</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="homepage">Página Inicial</SelectItem>
                    <SelectItem value="funnel">Funil de Vendas</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {field.value === 'homepage' 
                    ? 'Exibido na página principal' 
                    : 'Exibido no checkout/carrinho'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0} 
                    max={100}
                    placeholder="0" 
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormDescription>Opcional, para exibição</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="display_delay_seconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Atraso (segundos)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Tempo até exibir o popup</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="show_on_exit_intent"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Exit Intent</FormLabel>
                </div>
                <FormDescription>Exibir quando o usuário tentar sair</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Popup Ativo</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {popup ? 'Salvar Alterações' : 'Criar Popup'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
