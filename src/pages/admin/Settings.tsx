import { FormEvent, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type SystemType = 'A' | 'B' | 'C';

type SystemConfig = {
  id: number;
  name: string;
  type: SystemType;
};

const systemTypeOptions: { value: SystemType; label: string }[] = [
  { value: 'A', label: 'Checkout e pagamentos' },
  { value: 'B', label: 'Pedidos e entrega' },
  { value: 'C', label: 'Catálogo e operações' },
];

const defaultOperationalRules: { name: string; type: SystemType }[] = [
  { name: 'Conferir pedidos aprovados em até 15 minutos', type: 'A' },
  { name: 'Validar conciliação diária do Mercado Pago', type: 'A' },
  { name: 'Atualizar código de rastreio em até 24h', type: 'B' },
  { name: 'Revisar pedidos pendentes no início do dia', type: 'B' },
  { name: 'Revisar estoque crítico 2x ao dia', type: 'C' },
  { name: 'Auditar preço e descrição dos produtos semanalmente', type: 'C' },
];

const getTypeLabel = (type: SystemType) => {
  return systemTypeOptions.find((option) => option.value === type)?.label || type;
};

export default function Settings() {
  const { user, updateProfile, isLoading } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [systems, setSystems] = useState<SystemConfig[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<SystemType>('A');
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingRuleName, setEditingRuleName] = useState('');
  const [editingRuleType, setEditingRuleType] = useState<SystemType>('A');
  const [isSystemsLoading, setIsSystemsLoading] = useState(true);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [isCheckingMercadoPago, setIsCheckingMercadoPago] = useState(false);

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    setIsSystemsLoading(true);
    try {
      const data = await apiRequest('/systems');
      const normalized = Array.isArray(data) ? data : [];
      setSystems(normalized);
    } catch (error) {
      toast.error('Erro ao carregar configurações operacionais');
    } finally {
      setIsSystemsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (senha && senha !== confirmacaoSenha) {
      toast.error('As senhas não conferem');
      return;
    }

    const payload = senha ? { nome: nome.trim(), senha } : { nome: nome.trim() };
    const { error } = await updateProfile(payload);

    if (error) {
      toast.error(error.message || 'Erro ao salvar configurações');
      return;
    }

    toast.success('Configurações atualizadas com sucesso');
    setSenha('');
    setConfirmacaoSenha('');
  };

  const handleCreateRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newRuleName.trim()) {
      toast.error('Informe o nome da regra operacional');
      return;
    }

    setIsSavingRule(true);
    try {
      await apiRequest('/systems', {
        method: 'POST',
        body: JSON.stringify({
          name: newRuleName.trim(),
          type: newRuleType,
        }),
      });

      toast.success('Regra operacional criada com sucesso');
      setNewRuleName('');
      setNewRuleType('A');
      await fetchSystems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar regra operacional');
    } finally {
      setIsSavingRule(false);
    }
  };

  const startEditingRule = (rule: SystemConfig) => {
    setEditingRuleId(rule.id);
    setEditingRuleName(rule.name);
    setEditingRuleType(rule.type);
  };

  const cancelEditingRule = () => {
    setEditingRuleId(null);
    setEditingRuleName('');
    setEditingRuleType('A');
  };

  const handleUpdateRule = async (id: number) => {
    if (!editingRuleName.trim()) {
      toast.error('Nome da regra é obrigatório');
      return;
    }

    setIsSavingRule(true);
    try {
      await apiRequest(`/systems/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingRuleName.trim(),
          type: editingRuleType,
        }),
      });

      toast.success('Regra operacional atualizada');
      cancelEditingRule();
      await fetchSystems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar regra operacional');
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    setIsSavingRule(true);
    try {
      await apiRequest(`/systems/${id}`, { method: 'DELETE' });
      toast.success('Regra operacional removida');
      if (editingRuleId === id) cancelEditingRule();
      await fetchSystems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover regra operacional');
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleCheckMercadoPago = async () => {
    setIsCheckingMercadoPago(true);
    try {
      const result = await apiRequest('/mercadopago/check');
      if (result?.ok) {
        toast.success('Mercado Pago conectado com sucesso');
      } else {
        toast.error('Não foi possível validar a integração do Mercado Pago');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao testar Mercado Pago');
    } finally {
      setIsCheckingMercadoPago(false);
    }
  };

  const handleSeedDefaultRules = async () => {
    if (systems.length === 0 && isSystemsLoading) return;

    setIsSavingRule(true);
    try {
      const existingRuleKeys = new Set(
        systems.map((rule) => `${rule.type}:${rule.name.trim().toLowerCase()}`)
      );

      const rulesToCreate = defaultOperationalRules.filter((rule) => {
        const key = `${rule.type}:${rule.name.trim().toLowerCase()}`;
        return !existingRuleKeys.has(key);
      });

      if (rulesToCreate.length === 0) {
        toast.info('As regras padrão já estão cadastradas');
        return;
      }

      await Promise.all(
        rulesToCreate.map((rule) =>
          apiRequest('/systems', {
            method: 'POST',
            body: JSON.stringify(rule),
          })
        )
      );

      toast.success(`${rulesToCreate.length} regras padrão adicionadas`);
      await fetchSystems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar regras padrão');
    } finally {
      setIsSavingRule(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Configurações</h1>
        <p className="text-muted-foreground">Atualize os dados da sua conta administrativa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil do administrador</CardTitle>
          <CardDescription>Edite seu nome e senha de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" value={user?.email || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-name">Nome</Label>
              <Input
                id="admin-name"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Nova senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password-confirm">Confirmar nova senha</Label>
                <Input
                  id="admin-password-confirm"
                  type="password"
                  value={confirmacaoSenha}
                  onChange={(event) => setConfirmacaoSenha(event.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                Salvar configurações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integração Mercado Pago</CardTitle>
          <CardDescription>Valide se a credencial e a comunicação da API estão funcionando</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button type="button" onClick={handleCheckMercadoPago} disabled={isCheckingMercadoPago}>
            {isCheckingMercadoPago ? 'Testando...' : 'Testar conexão'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras operacionais do sistema</CardTitle>
          <CardDescription>Configure regras usadas na operação diária da loja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleSeedDefaultRules} disabled={isSavingRule || isSystemsLoading}>
              Adicionar regras padrão
            </Button>
          </div>

          <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="new-rule-name">Nome da regra</Label>
              <Input
                id="new-rule-name"
                value={newRuleName}
                onChange={(event) => setNewRuleName(event.target.value)}
                placeholder="Ex.: Revisar pedidos pagos em até 2h"
              />
            </div>

            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={newRuleType} onValueChange={(value) => setNewRuleType(value as SystemType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {systemTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={isSavingRule}>
                Adicionar regra
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {isSystemsLoading ? (
              <p className="text-sm text-muted-foreground">Carregando regras...</p>
            ) : systems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma regra operacional cadastrada.</p>
            ) : (
              systems.map((rule) => (
                <div key={rule.id} className="border border-border rounded-lg p-4 space-y-3">
                  {editingRuleId === rule.id ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`rule-name-${rule.id}`}>Nome</Label>
                        <Input
                          id={`rule-name-${rule.id}`}
                          value={editingRuleName}
                          onChange={(event) => setEditingRuleName(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Área</Label>
                        <Select
                          value={editingRuleType}
                          onValueChange={(value) => setEditingRuleType(value as SystemType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {systemTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={cancelEditingRule} disabled={isSavingRule}>
                          Cancelar
                        </Button>
                        <Button type="button" onClick={() => handleUpdateRule(rule.id)} disabled={isSavingRule}>
                          Salvar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{getTypeLabel(rule.type)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => startEditingRule(rule)} disabled={isSavingRule}>
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={isSavingRule}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}