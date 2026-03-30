import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { UserForm } from '@/components/admin/UserForm';
import type { User } from '@/hooks/useAuth';

export default function Users() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => apiRequest('/users'),
  });

  const users: User[] = Array.isArray(responseData)
    ? responseData
    : (responseData?.data || responseData?.rows || responseData?.users || []);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/users/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário removido com sucesso');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erro ao remover usuário';
      toast.error(message);
    },
  });

  const handleEditUser = (selectedUser: User) => {
    setEditingUser(selectedUser);
    setIsUserFormOpen(true);
  };

  const handleUserFormChange = (open: boolean) => {
    setIsUserFormOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Usuários</h1>
        <p className="text-muted-foreground">Visualize e gerencie os usuários da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nome</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">CPF</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Admin</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">{userItem.nome}</td>
                      <td className="p-4 align-middle">{userItem.email}</td>
                      <td className="p-4 align-middle">{userItem.cpf || '-'}</td>
                      <td className="p-4 align-middle">{userItem.isAdmin ? 'Sim' : 'Não'}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditUser(userItem)}
                            title="Editar usuário"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(userItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUserFormOpen} onOpenChange={handleUserFormChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          {isUserFormOpen && (
            <UserForm
              user={editingUser}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                setIsUserFormOpen(false);
                setEditingUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
