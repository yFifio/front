import { test, expect, request as apiRequest } from '@playwright/test';

const BASE_API = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';
const ADMIN_PASSWORD = 'Admin@123';

function validarCpfBackend(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;

  let soma = 0;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.substring(10, 11), 10)) return false;

  return true;
}

function gerarCpfValido(): string {
  for (let tentativa = 0; tentativa < 1000; tentativa++) {
    const cpf = String(Math.floor(Math.random() * 1_000_000_00000)).padStart(11, '0');
    if (validarCpfBackend(cpf)) return cpf;
  }
  return '52998224725';
}

let adminEmail = '';
let adminToken = '';

test.beforeAll(async () => {
  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });
  let body: { token?: string; user?: { isAdmin?: boolean } } = {};
  let setupOk = false;
  let ultimoErroCadastro = '';

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const seed = Date.now();
    adminEmail = `admin_ui_${seed}_${tentativa}@teste.local`;
    const adminCpf = gerarCpfValido();

    const registerRes = await ctx.post(`${BASE_API}/register`, {
      data: { nome: 'Admin UI E2E', email: adminEmail, senha: ADMIN_PASSWORD, cpf: adminCpf },
    });

    if (![200, 201].includes(registerRes.status())) {
      const registerBody = await registerRes.json().catch(() => ({}));
      ultimoErroCadastro = String((registerBody as { error?: string })?.error || registerRes.status());
      continue;
    }

    const loginRes = await ctx.post(`${BASE_API}/login`, {
      data: { email: adminEmail, senha: ADMIN_PASSWORD },
    });
    if (!loginRes.ok()) {
      continue;
    }

    body = await loginRes.json().catch(() => ({}));
    adminToken = String(body.token ?? '');
    if (!adminToken) {
      continue;
    }

    setupOk = true;
    break;
  }

  if (!setupOk) {
    throw new Error(`Falha ao preparar admin para products.spec (${ultimoErroCadastro || 'sem detalhe'})`);
  }
  
  if (!body.user?.isAdmin) {
    await ctx.put(`${BASE_API}/users/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isAdmin: true },
    });
    
    const relogin = await ctx.post(`${BASE_API}/login`, {
      data: { email: adminEmail, senha: ADMIN_PASSWORD },
    });
    const rb = await relogin.json().catch(() => ({}));
    adminToken = rb.token ?? '';
    if (!adminToken || !rb.user?.isAdmin) throw new Error('Falha ao promover admin');
  }
  await ctx.dispose();
});

test.describe('Produtos - CRUD Completo via UI (Admin)', () => {
  test('deve executar CRUD completo de produto com sucesso e falhas no mesmo cenario', async ({ page, request }) => {
    await page.goto('/auth');
    await page.locator('#login-email').fill(adminEmail);
    await page.locator('#login-password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    await page.goto('/admin/products');
    await expect(page.getByRole('heading', { name: /Produtos/i })).toBeVisible({ timeout: 8000 });
    
    await page.getByRole('button', { name: /Novo Produto/i }).click();
    await expect(page).toHaveURL(/\/admin\/products\/new/, { timeout: 8000 });
    
    const productName = `Produto UI E2E ${Date.now()}`;
    await page.locator('input').first().fill(productName);
    await page.locator('input[type="number"]').first().fill('49.90');
    
    const createResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/products') && resp.request().method() === 'POST',
      { timeout: 12000 }
    );
    await page.getByRole('button', { name: /Salvar/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);

    const createdProduct = await createResponse.json().catch(() => ({}));
    const createdProductId = Number(createdProduct?.id ?? 0);
    expect(Number.isFinite(createdProductId)).toBe(true);
    expect(createdProduct?.name).toBe(productName);

    const createdEntityResponse = await request.get(`${BASE_API}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(createdEntityResponse.status()).toBe(200);
    const createdEntityBody = await createdEntityResponse.json().catch(() => ({}));
    expect(createdEntityBody?.name).toBe(productName);

    await expect(page).toHaveURL('/admin/products', { timeout: 10000 });
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10000 });
    
    const productCard = page
      .locator('[class*="overflow-hidden"]')
      .filter({ has: page.locator('h3', { hasText: productName }) });
    await expect(productCard).toBeVisible({ timeout: 8000 });
    
    await productCard.getByRole('button').first().click();
    await expect(page).toHaveURL(/\/admin\/products\/edit\//, { timeout: 8000 });
    
    const updatedName = `${productName} EDITADO`;
    const nameInput = page.locator('input').first();
    await nameInput.clear();
    await nameInput.fill(updatedName);

    const updateResponsePromise = page.waitForResponse(
      (resp) => /\/api\/products\/\d+$/.test(resp.url()) && resp.request().method() === 'PUT',
      { timeout: 12000 }
    );
    await page.getByRole('button', { name: /Salvar/i }).click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    const updatedEntityResponse = await request.get(`${BASE_API}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(updatedEntityResponse.status()).toBe(200);
    const updatedEntityBody = await updatedEntityResponse.json().catch(() => ({}));
    expect(updatedEntityBody?.name).toBe(updatedName);

    await expect(page).toHaveURL('/admin/products', { timeout: 10000 });
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 });
    
    const updatedCard = page
      .locator('[class*="overflow-hidden"]')
      .filter({ has: page.locator('h3', { hasText: updatedName }) });
    await expect(updatedCard).toBeVisible({ timeout: 8000 });
    
    await updatedCard.getByRole('button').nth(1).click();
    await page.getByRole('button', { name: /Excluir/i }).last().click();
    await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 10000 });

    const deletedEntityResponse = await request.get(`${BASE_API}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(deletedEntityResponse.status()).toBe(404);
    
    const semAuth = await request.post(`${BASE_API}/products`, {
      data: { name: 'Produto sem auth', description: 'N/A', price: 10, category: 'digital' },
    });
    expect(semAuth.status()).toBe(401);
    
    const invalido = await request.post(`${BASE_API}/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { description: 'Sem nome', price: -1 },
    });
    expect([400, 422]).toContain(invalido.status());
    
    const editarInexistente = await request.put(`${BASE_API}/products/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { name: 'Inexistente', price: 1, category: 'digital' },
    });
    expect([404, 400]).toContain(editarInexistente.status());
    
    const excluirInexistente = await request.delete(`${BASE_API}/products/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 400]).toContain(excluirInexistente.status());
  });
});