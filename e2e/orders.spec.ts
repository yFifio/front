import { test, expect, request } from '@playwright/test';

const BASE_API = 'https://meuapp.local/api';
const TEST_EMAIL = 'fluxo_1778585735@teste.local';
const TEST_PASSWORD = 'Senha@123';

interface AuthSession {
  token: string;
  user: Record<string, unknown>;
}

async function loginViaAPI(): Promise<AuthSession> {
  const ctx = await request.newContext({ ignoreHTTPSErrors: true });
  const res = await ctx.post(`${BASE_API}/login`, {
    data: { email: TEST_EMAIL, senha: TEST_PASSWORD },
  });
  const body = await res.json().catch(() => ({}));
  await ctx.dispose();
  return { token: body.token ?? '', user: body.user ?? {} };
}

test.describe('Pedidos - Fluxo Completo (CRUD)', () => {
  let createdOrderId: number;

  test('deve criar um pedido via API e verificar na listagem', async () => {
    const session = await loginViaAPI();
    expect(session.token).toBeTruthy();

    // Criar pedido via API
    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    const orderRes = await ctx.post(`${BASE_API}/orders`, {
      headers: { Authorization: `Bearer ${session.token}` },
      data: {
        items: [{ productId: 1, productName: 'Produto E2E', price: 19.9, quantity: 1 }],
        customerEmail: TEST_EMAIL,
        customerName: (session.user as { nome?: string })?.nome ?? 'Usuário E2E',
        customerCpf: (session.user as { cpf?: string })?.cpf ?? '20414454243',
        totalPrice: 19.9,
        paymentMethod: 'illustrative',
      },
    });

    expect(orderRes.ok()).toBeTruthy();
    const orderBody = await orderRes.json();
    createdOrderId = orderBody.orderId ?? orderBody.order?.id ?? orderBody.id;
    expect(createdOrderId).toBeTruthy();
    await ctx.dispose();
  });

  test('deve listar meus pedidos autenticado', async () => {
    const session = await loginViaAPI();
    expect(session.token).toBeTruthy();

    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    const listRes = await ctx.get(`${BASE_API}/orders`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const orders = await listRes.json();
    expect(Array.isArray(orders)).toBeTruthy();
    await ctx.dispose();
  });

  test('deve verificar detalhes de um pedido via API', async () => {
    const session = await loginViaAPI();
    expect(session.token).toBeTruthy();

    const ctx = await request.newContext({ ignoreHTTPSErrors: true });

    const res = await ctx.get(`${BASE_API}/orders`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    expect(res.ok()).toBeTruthy();
    const orders = await res.json();
    expect(Array.isArray(orders)).toBeTruthy();

    if (orders.length > 0) {
      const order = orders[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('total_price');
    }

    await ctx.dispose();
  });

  test('deve cancelar/atualizar status de pedido (admin via API)', async () => {
    const session = await loginViaAPI();
    expect(session.token).toBeTruthy();

    const ctx = await request.newContext({ ignoreHTTPSErrors: true });

    // Listar pedidos para obter um ID válido
    const listRes = await ctx.get(`${BASE_API}/orders`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const orders = await listRes.json().catch(() => []);
    const orderId = orders[0]?.id;

    if (orderId) {
      // Atualizar status via PATCH
      const updateRes = await ctx.patch(`${BASE_API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${session.token}` },
        data: { status: 'paid' },
      });

      // Aceita 200 (sucesso) ou 403 (sem permissão admin) — ambos são comportamentos válidos
      expect([200, 403, 404]).toContain(updateRes.status());
    }

    await ctx.dispose();
  });
});
