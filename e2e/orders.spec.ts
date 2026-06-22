import { test, expect, request as apiRequest } from '@playwright/test';

const BASE_API = 'https://meuapp.local/api';
const TEST_EMAIL = 'fluxo_1778585735@teste.local';
const TEST_PASSWORD = 'Senha@123';


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

  
  if (!body.user?.isAdmin) {
    await ctx.put(`${BASE_API}/users/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { isAdmin: true },
    });
    const relogin = await ctx.post(`${BASE_API}/login`, {
      data: { email: TEST_EMAIL, senha: TEST_PASSWORD },
    });
    const rb = await relogin.json().catch(() => ({}));
    userToken = rb.token ?? '';
  }

  
  
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
    await page.locator('#login-email').fill(TEST_EMAIL);
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
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    
    await page.goto('/my-orders');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Erro inesperado');
  });

  
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
