import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/api';
import type { User } from '@/hooks/useAuth';

interface UpdateUserPayload {
  nome: string;
  cpf: string;
  isAdmin: boolean;
  senha?: string;
}

interface UserFormProps {
  user: User;
  onSuccess: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const [nome, setNome] = useState(user.nome || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(!!user.isAdmin);
  const mutation = useMutation({
    mutationFn: async (data: UpdateUserPayload) => {
      return await apiRequest(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!');
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar usuário: ' + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateUserPayload = { nome, cpf, isAdmin };
    if (password.trim()) payload.senha = password;
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={user.email} disabled />
      </div>
      <div className="space-y-2">
        <Label>CPF</Label>
        <Input value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} maxLength={11} required />
      </div>
      <div className="space-y-2">
        <Label>Nova senha</Label>
        <Input
          type="password"
          placeholder="Deixe em branco para não alterar"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isAdmin}
          onCheckedChange={(v) => setIsAdmin(!!v)}
        />
        <Label>Administrador</Label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
