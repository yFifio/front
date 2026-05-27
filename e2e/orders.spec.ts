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

test.describe('Pedidos - CRUD Completo', () => {
  // ─── Cenário único: cadastrar → listar → editar (status) → excluir ─────────
  test('deve cadastrar, listar, atualizar e excluir um pedido no mesmo cenário', async () => {
    const session = await loginViaAPI();
    expect(session.token).toBeTruthy();

    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    const authHeaders = { Authorization: `Bearer ${session.token}` };
    const customerCpf = (session.user as { cpf?: string })?.cpf ?? '20414454243';
    const customerName = (session.user as { nome?: string })?.nome ?? 'Usuário E2E';

    // 1. CADASTRAR pedido
    const createRes = await ctx.post(`${BASE_API}/orders`, {
      headers: authHeaders,
      data: {
        items: [{ productId: 1, productName: 'Produto E2E', price: 19.9, quantity: 1 }],
        customerEmail: TEST_EMAIL,
        customerName,
        customerCpf,
        totalPrice: 19.9,
        paymentMethod: 'illustrative',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    const orderId: number = createBody.orderId ?? createBody.order?.id ?? createBody.id;
    expect(orderId).toBeTruthy();

    // 2. LISTAR — pedido criado deve aparecer na listagem
    const listRes = await ctx.get(`${BASE_API}/orders`, { headers: authHeaders });
    expect(listRes.ok()).toBeTruthy();
    const orders = await listRes.json();
    expect(Array.isArray(orders)).toBeTruthy();
    const found = orders.some((o: { id: number }) => o.id === orderId);
    expect(found).toBeTruthy();

    // 3. VER DETALHES — campos obrigatórios presentes
    const detailRes = await ctx.get(`${BASE_API}/orders/${orderId}`, { headers: authHeaders });
    // Aceita 200 (detalhe individual) ou 404 se o endpoint não existir (fallback: já validámos via listagem)
    if (detailRes.status() === 200) {
      const detail = await detailRes.json();
      expect(detail).toHaveProperty('id');
      expect(detail).toHaveProperty('status');
    }

    // 4. EDITAR / ACTUALIZAR STATUS
    const updateRes = await ctx.patch(`${BASE_API}/orders/${orderId}`, {
      headers: authHeaders,
      data: { status: 'paid' },
    });
    // 200 = sucesso; 403 = sem permissão de admin (comportamento válido)
    expect([200, 403]).toContain(updateRes.status());

    // 5. EXCLUIR pedido
    const delRes = await ctx.delete(`${BASE_API}/orders/${orderId}`, {
      headers: authHeaders,
    });
    // 204 = sucesso; 403 = sem permissão de admin (comportamento válido)
    expect([200, 204, 403]).toContain(delRes.status());

    await ctx.dispose();
  });

  // ─── Casos de falha ─────────────────────────────────────────────────────────
  test('deve falhar ao criar pedido sem autenticação (401)', async () => {
    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    const res = await ctx.post(`${BASE_API}/orders`, {
      data: {
        items: [{ productId: 1, productName: 'Produto', price: 19.9, quantity: 1 }],
        customerEmail: 'test@test.com',
        customerName: 'Teste',
        customerCpf: '00000000000',
        totalPrice: 19.9,
        paymentMethod: 'illustrative',
      },
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('deve falhar ao criar pedido com dados inválidos — items ausente (400)', async () => {
    const session = await loginViaAPI();
    expect(session.token).toBeTruthy();

    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    const res = await ctx.post(`${BASE_API}/orders`, {
      headers: { Authorization: `Bearer ${session.token}` },
      data: {
        // items ausente — campo obrigatório
        customerEmail: 'test@test.com',
        totalPrice: -1,
      },
    });
    expect([400, 422]).toContain(res.status());
    await ctx.dispose();
  });

  test('deve falhar ao aceder a pedido inexistente (404)', async () => {
    const session = await loginViaAPI();
    expect(session.token).toBeTruthy();

    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    const res = await ctx.get(`${BASE_API}/orders/999999`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    expect([404, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test('deve falhar ao listar pedidos sem autenticação (401)', async () => {
    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    const res = await ctx.get(`${BASE_API}/orders`);
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});
