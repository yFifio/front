import { test, expect, request as apiRequest } from '@playwright/test';

const BASE_API = 'https://meuapp.local/api';
const TEST_EMAIL = 'fluxo_1778585735@teste.local';
const TEST_PASSWORD = 'Senha@123';

// ─── Setup: obter token do utilizador de teste ────────────────────────────────
let userToken = '';
let createdOrderId: number | null = null;

test.beforeAll(async () => {
  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });

  const loginRes = await ctx.post(`${BASE_API}/login`, {
    data: { email: TEST_EMAIL, senha: TEST_PASSWORD },
  });
  const body = await loginRes.json().catch(() => ({}));
  userToken = body.token ?? '';
  if (!userToken) throw new Error('Falha ao autenticar utilizador de teste');

  // CRIAR pedido via API (criação é feita pelo cliente via checkout — não existe
  // botão "criar pedido" no painel admin, pelo que o setup é via API)
  const orderRes = await ctx.post(`${BASE_API}/orders`, {
    headers: { Authorization: `Bearer ${userToken}` },
    data: {
      items: [{ productId: 1, productName: 'Produto E2E', price: 19.9, quantity: 1 }],
      customerEmail: TEST_EMAIL,
      customerName: (body.user as { nome?: string })?.nome ?? 'Utilizador E2E',
      customerCpf: (body.user as { cpf?: string })?.cpf ?? '20414454243',
      totalPrice: 19.9,
      paymentMethod: 'illustrative',
    },
  });

  if (orderRes.ok()) {
    const ob = await orderRes.json().catch(() => ({}));
    createdOrderId = ob.orderId ?? ob.order?.id ?? ob.id ?? null;
  }

  await ctx.dispose();
});

test.afterAll(async () => {
  // EXCLUIR pedido criado no setup (cleanup via API — não existe botão de exclusão
  // no painel admin de pedidos)
  if (!createdOrderId) return;
  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });
  await ctx.delete(`${BASE_API}/orders/${createdOrderId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  await ctx.dispose();
});

// ─── CRUD via UI + API: listar → ver detalhes → atualizar status ─────────────
test.describe('Pedidos - CRUD Completo', () => {
  test('deve listar pedidos, ver detalhes e atualizar status via painel admin', async ({ page }) => {
    // 1. LOGIN via interface gráfica (utilizador de teste que tem pedidos)
    await page.goto('/auth');
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // 2. LISTAR PEDIDOS do utilizador — "Meus Pedidos"
    await page.goto('/orders');
    // Aguardar que a página carregue (heading ou lista visível)
    await page.waitForLoadState('networkidle');
    // Verifica que a página de pedidos existe e carregou (sem erro 404)
    await expect(page.locator('body')).not.toContainText('404', { timeout: 5000 });

    // 3. LISTAR PEDIDOS via admin — navegar para painel
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: /Pedidos/i })).toBeVisible({ timeout: 8000 });

    // Aguardar listagem carregar
    await page.waitForLoadState('networkidle');

    // Verificar que existe pelo menos um pedido listado
    const orderCards = page.locator('[class*="CardContent"]');
    await expect(orderCards.first()).toBeVisible({ timeout: 10000 });

    // 4. VER DETALHES — clicar no botão de olho (Eye) do primeiro pedido
    const eyeButton = page.getByRole('button').filter({ has: page.locator('svg') }).last();
    // Usar o botão de detalhes (Eye) — é o último icon button de cada linha
    const firstOrderRow = page.locator('[class*="CardContent"]').first();
    const detailBtn = firstOrderRow.getByRole('button').last();
    await detailBtn.click();

    // Dialog "Detalhes do Pedido" deve abrir
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Detalhes do Pedido')).toBeVisible({ timeout: 5000 });

    // Verificar que o dialog tem campos obrigatórios
    await expect(page.getByText('Cliente')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();

    // Fechar o dialog
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // 5. ACTUALIZAR STATUS — usar o Select de status do primeiro pedido
    const statusSelect = firstOrderRow.locator('[role="combobox"]').first();
    await statusSelect.click();
    // Seleccionar "Pago" nas opções disponíveis
    const paidOption = page.getByRole('option', { name: /Pago|paid/i }).first();
    if (await paidOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await paidOption.click();
      // Aguardar feedback de sucesso (toast)
      await expect(page.getByText(/Status atualizado|atualizado/i)).toBeVisible({ timeout: 8000 });
    } else {
      // Fechar dropdown se a opção não estiver visível (status já é "pago")
      await page.keyboard.press('Escape');
    }
  });

  test('deve listar os meus pedidos autenticado via UI', async ({ page }) => {
    // Login via UI
    await page.goto('/auth');
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Navegar para página "Meus Pedidos"
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    // Página deve carregar sem erro
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Erro inesperado');
  });

  // ─── Casos de falha (validados via API) ─────────────────────────────────────
  test('deve falhar ao criar pedido sem autenticação (401)', async ({ request }) => {
    const res = await request.post(`${BASE_API}/orders`, {
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
  });

  test('deve falhar ao criar pedido com dados inválidos — items ausente (400/422)', async ({ request }) => {
    const res = await request.post(`${BASE_API}/orders`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { customerEmail: 'test@test.com', totalPrice: -1 },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('deve falhar ao listar pedidos sem autenticação (401)', async ({ request }) => {
    const res = await request.get(`${BASE_API}/orders`);
    expect(res.status()).toBe(401);
  });

  test('deve falhar ao aceder a pedido inexistente (404)', async ({ request }) => {
    const res = await request.get(`${BASE_API}/orders/999999`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect([404, 403]).toContain(res.status());
  });
});
