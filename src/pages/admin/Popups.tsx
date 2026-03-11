import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PopupForm } from '@/components/admin/PopupForm';
import { usePopups, useCreatePopup, useUpdatePopup, useDeletePopup } from '@/hooks/usePopups';
import type { Popup, PopupFormData } from '@/types/popup';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Megaphone, 
  ShoppingCart,
  Home,
  Image as ImageIcon,
  Clock,
  MousePointer
} from 'lucide-react';

export default function Popups() {
  const [activeTab, setActiveTab] = useState<'homepage' | 'funnel'>('homepage');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [deletePopup, setDeletePopup] = useState<Popup | null>(null);

  const { data: popups, isLoading } = usePopups();
  const createMutation = useCreatePopup();
  const updateMutation = useUpdatePopup();
  const deleteMutation = useDeletePopup();

  const homepagePopups = popups?.filter(p => p.popup_type === 'homepage') || [];
  const funnelPopups = popups?.filter(p => p.popup_type === 'funnel') || [];

  const handleCreate = async (data: PopupFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Popup criado com sucesso!');
      setIsFormOpen(false);
    } catch (error) {
      toast.error('Erro ao criar popup');
    }
  };

  const handleUpdate = async (data: PopupFormData) => {
    if (!editingPopup) return;
    try {
      await updateMutation.mutateAsync({ id: editingPopup.id, ...data });
      toast.success('Popup atualizado com sucesso!');
      setEditingPopup(null);
    } catch (error) {
      toast.error('Erro ao atualizar popup');
    }
  };

  const handleDelete = async () => {
    if (!deletePopup) return;
    try {
      await deleteMutation.mutateAsync(deletePopup.id);
      toast.success('Popup excluído com sucesso!');
      setDeletePopup(null);
    } catch (error) {
      toast.error('Erro ao excluir popup');
    }
  };

  const handleToggleActive = async (popup: Popup) => {
    try {
      await updateMutation.mutateAsync({ id: popup.id, is_active: !popup.is_active });
      toast.success(popup.is_active ? 'Popup desativado' : 'Popup ativado');
    } catch (error) {
      toast.error('Erro ao atualizar popup');
    }
  };

  const PopupCard = ({ popup }: { popup: Popup }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{popup.title}</CardTitle>
              {popup.discount_percent && popup.discount_percent > 0 && (
                <Badge variant="destructive">{popup.discount_percent}% OFF</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {popup.content || 'Sem descrição'}
            </CardDescription>
          </div>
          <Switch
            checked={popup.is_active}
            onCheckedChange={() => handleToggleActive(popup)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {popup.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden bg-muted aspect-video">
            <img 
              src={popup.image_url} 
              alt={popup.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
          {popup.display_delay_seconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {popup.display_delay_seconds}s delay
            </span>
          )}
          {popup.show_on_exit_intent && (
            <span className="flex items-center gap-1">
              <MousePointer className="w-3 h-3" />
              Exit Intent
            </span>
          )}
          {popup.button_text && (
            <span className="flex items-center gap-1">
              Botão: "{popup.button_text}"
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setEditingPopup(popup)}
          >
            <Pencil className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeletePopup(popup)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ type }: { type: 'homepage' | 'funnel' }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        {type === 'homepage' ? (
          <Home className="w-6 h-6 text-muted-foreground" />
        ) : (
          <ShoppingCart className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-medium mb-1">
        Nenhum popup {type === 'homepage' ? 'de página inicial' : 'de funil'}
      </h3>
      <p className="text-muted-foreground mb-4">
        {type === 'homepage' 
          ? 'Crie popups para capturar a atenção dos visitantes'
          : 'Crie popups para aumentar conversões no checkout'}
      </p>
      <Button onClick={() => { setActiveTab(type); setIsFormOpen(true); }}>
        <Plus className="w-4 h-4 mr-2" />
        Criar Popup
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            Popups Promocionais
          </h1>
          <p className="text-muted-foreground">
            Gerencie popups para aumentar suas vendas
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Popup
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'homepage' | 'funnel')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="homepage" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Página Inicial ({homepagePopups.length})
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Funil de Vendas ({funnelPopups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="mt-6">
          {homepagePopups.length === 0 ? (
            <EmptyState type="homepage" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {homepagePopups.map(popup => (
                <PopupCard key={popup.id} popup={popup} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          {funnelPopups.length === 0 ? (
            <EmptyState type="funnel" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {funnelPopups.map(popup => (
                <PopupCard key={popup.id} popup={popup} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog 
        open={isFormOpen || !!editingPopup} 
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingPopup(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPopup ? 'Editar Popup' : 'Criar Novo Popup'}
            </DialogTitle>
            <DialogDescription>
              {editingPopup 
                ? 'Altere as configurações do popup'
                : 'Configure o popup promocional'}
            </DialogDescription>
          </DialogHeader>
          <PopupForm
            popup={editingPopup || undefined}
            defaultType={activeTab}
            onSubmit={editingPopup ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingPopup(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePopup} onOpenChange={(open) => !open && setDeletePopup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Popup?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o popup "{deletePopup?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
