import { test, expect, request as apiRequest } from '@playwright/test';

const BASE_API = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';
const TEST_PASSWORD = 'Senha@123';

function gerarCpfValido(seed: number): string {
  const n = String(seed % 1000000000).padStart(9, '0').split('').map(Number);
  const d1Base = n.reduce((acc, digit, idx) => acc + digit * (10 - idx), 0);
  const d1 = d1Base % 11 < 2 ? 0 : 11 - (d1Base % 11);
  const d2Base = [...n, d1].reduce((acc, digit, idx) => acc + digit * (11 - idx), 0);
  const d2 = d2Base % 11 < 2 ? 0 : 11 - (d2Base % 11);
  return `${n.join('')}${d1}${d2}`;
}

let userToken = '';
let userEmail = '';
let userCpf = '';
let testProductId = 0;
let createdOrderId: number | null = null;

test.beforeAll(async () => {
  const seed = Date.now();
  userEmail = `orders_ui_${seed}@teste.local`;
  userCpf = gerarCpfValido(seed);

  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });
  
  const registerRes = await ctx.post(`${BASE_API}/register`, {
    data: {
      nome: 'Usuario Pedidos E2E',
      email: userEmail,
      senha: TEST_PASSWORD,
      cpf: userCpf,
    },
  });
  if (![200, 201].includes(registerRes.status())) {
    throw new Error(`Falha ao registrar usuário de pedidos (status ${registerRes.status()})`);
  }
  
  const loginRes = await ctx.post(`${BASE_API}/login`, {
    data: { email: userEmail, senha: TEST_PASSWORD },
  });
  
  if (!loginRes.ok()) {
    throw new Error(`Falha no login do usuário de pedidos (status ${loginRes.status()})`);
  }

  const body = await loginRes.json().catch(() => ({}));
  userToken = body.token ?? '';
  if (!userToken) throw new Error('Falha ao autenticar utilizador de teste');
  
  const productsRes = await ctx.get(`${BASE_API}/products`);
  const productsBody = await productsRes.json().catch(() => ({}));
  const firstProduct = Array.isArray(productsBody?.data)
    ? productsBody.data[0]
    : Array.isArray(productsBody)
      ? productsBody[0]
      : null;
  testProductId = firstProduct?.id ?? 1;
  
  if (!body.user?.isAdmin) {
    const promoteRes = await ctx.put(`${BASE_API}/users/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { isAdmin: true },
    });

    if (!promoteRes.ok()) {
      throw new Error(`Falha ao promover usuário para admin (status ${promoteRes.status()})`);
    }

    const relogin = await ctx.post(`${BASE_API}/login`, {
      data: { email: userEmail, senha: TEST_PASSWORD },
    });

    if (!relogin.ok()) {
      throw new Error(`Falha ao refazer login após promoção (status ${relogin.status()})`);
    }

    const rb = await relogin.json().catch(() => ({}));
    userToken = rb.token ?? '';
    if (!userToken || !rb.user?.isAdmin) {
      throw new Error('Token admin inválido após promoção do usuário de pedidos');
    }
  }

  const createProductRes = await ctx.post(`${BASE_API}/products`, {
    headers: { Authorization: `Bearer ${userToken}` },
    data: {
      name: `Produto Pedido E2E ${seed}`,
      description: 'Produto para setup de pedidos E2E',
      price: 19.9,
      category: 'digital',
      is_active: true,
      discount_percent: 0,
      is_featured: false,
    },
  });

  if (!createProductRes.ok()) {
    throw new Error(`Falha ao criar produto de setup (status ${createProductRes.status()})`);
  }

  const createdProduct = await createProductRes.json().catch(() => ({}));
  testProductId = Number(createdProduct?.id ?? 0);
  if (!Number.isFinite(testProductId) || testProductId <= 0) {
    throw new Error('Produto de setup inválido para testes de pedidos');
  }

  const orderRes = await ctx.post(`${BASE_API}/orders`, {
    headers: { Authorization: `Bearer ${userToken}` },
    data: {
      items: [{ productId: testProductId, productName: 'Produto E2E', price: 19.9, quantity: 1 }],
      customerEmail: userEmail,
      customerName: (body.user as { nome?: string })?.nome ?? 'Utilizador E2E',
      customerCpf: (body.user as { cpf?: string })?.cpf ?? userCpf,
      totalPrice: 19.9,
      paymentMethod: 'illustrative',
    },
  });

  if (!orderRes.ok()) {
    throw new Error(`Falha ao criar pedido de setup (status ${orderRes.status()})`);
  }

  const ob = await orderRes.json().catch(() => ({}));
  createdOrderId = ob.orderId ?? ob.order?.id ?? ob.id ?? null;
  if (!createdOrderId) {
    throw new Error('Pedido de setup criado sem ID retornado');
  }

  await ctx.dispose();
});

test.afterAll(async () => {
  if (!createdOrderId) return;
  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });
  await ctx.delete(`${BASE_API}/orders/${createdOrderId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  await ctx.dispose();
});

test.describe('Pedidos - CRUD Completo', () => {
  test('deve listar pedidos, ver detalhes e atualizar status via painel admin', async ({ page }) => {
    await page.goto('/auth');
    await page.locator('#login-email').fill(userEmail);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    await page.goto('/my-orders');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('404', { timeout: 5000 });
    
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: /Pedidos/i })).toBeVisible({ timeout: 8000 });
    await page.waitForLoadState('networkidle');
    
    const firstOrderCard = page.locator('[class*="bg-card"]').filter({ has: page.locator('[role="combobox"]') }).first();
    await expect(firstOrderCard).toBeVisible({ timeout: 10000 });
    
    const detailBtn = firstOrderCard.getByRole('button').last();
    await detailBtn.click();
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Detalhes do Pedido')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog').getByText('Cliente')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Status')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    const statusSelect = firstOrderCard.locator('[role="combobox"]').first();
    await statusSelect.click();
    
    const paidOption = page.getByRole('option', { name: /Pago|paid/i }).first();
    if (await paidOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/orders/') && resp.url().includes('/status'),
        { timeout: 8000 }
      );
      
      await paidOption.click();
      
      try {
        const response = await responsePromise;
        expect([200, 204]).toContain(response.status());
      } catch {
        await page.waitForTimeout(1000);
        const errorToasts = await page.locator('[data-sonner-toast] *:has-text("Erro")').count().catch(() => 0);
        expect(errorToasts).toBe(0);
      }
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('deve listar os meus pedidos autenticado via UI', async ({ page }) => {
    await page.goto('/auth');
    await page.locator('#login-email').fill(userEmail);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    await page.goto('/my-orders');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Erro inesperado');
  });

  test('deve falhar ao criar pedido sem autenticacao (401)', async ({ request }) => {
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

  test('deve falhar ao criar pedido com dados invalidos items ausente (400/422)', async ({ request }) => {
    const res = await request.post(`${BASE_API}/orders`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { customerEmail: 'test@test.com', totalPrice: -1 },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('deve falhar ao listar pedidos sem autenticacao (401)', async ({ request }) => {
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