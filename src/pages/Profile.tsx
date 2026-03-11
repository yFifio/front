import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { validarCPF } from '@/lib/validators';

export default function Profile() {
  const { user, updateProfile, isLoading } = useAuth();
  
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setCpf(user.cpf || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha && senha !== confirmSenha) {
      return toast.error('As senhas não coincidem');
    }

    if (senha && !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(senha)) {
        return toast.error('A senha deve conter maiúsculas, minúsculas e números.');
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (!validarCPF(cleanCpf)) {
      return toast.error('CPF inválido');
    }

    const dadosAtualizacao: { nome: string; cpf: string; senha?: string } = { nome, cpf: cleanCpf };
    if (senha) dadosAtualizacao.senha = senha;

    const result = await updateProfile(dadosAtualizacao);

    if (result.error) {
      toast.error('Erro ao atualizar perfil.');
    } else {
      toast.success('Perfil atualizado com sucesso!');
      setSenha('');
      setConfirmSenha('');
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>O meu Perfil</CardTitle>
          <CardDescription>Gerencie as suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                maxLength={11}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Alterar Senha (Opcional)</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Nova Senha</Label>
                  <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Nova senha" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmSenha">Confirmar Nova Senha</Label>
                  <Input id="confirmSenha" type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}