import { test, expect, request as apiRequest } from '@playwright/test';

const BASE_API = 'https://meuapp.local/api';
const ADMIN_PASSWORD = 'Admin@123';

function gerarCpfValido(seed: number): string {
  const n = String(seed % 1000000000).padStart(9, '0').split('').map(Number);
  const d1Base = n.reduce((acc, digit, idx) => acc + digit * (10 - idx), 0);
  const d1 = d1Base % 11 < 2 ? 0 : 11 - (d1Base % 11);
  const d2Base = [...n, d1].reduce((acc, digit, idx) => acc + digit * (11 - idx), 0);
  const d2 = d2Base % 11 < 2 ? 0 : 11 - (d2Base % 11);
  return `${n.join('')}${d1}${d2}`;
}

let adminEmail = '';
let adminToken = '';

test.beforeAll(async () => {
  const seed = Date.now();
  adminEmail = `admin_categories_${seed}@teste.local`;
  const adminCpf = gerarCpfValido(seed);

  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });

  await ctx.post(`${BASE_API}/register`, {
    data: { nome: 'Admin Categories E2E', email: adminEmail, senha: ADMIN_PASSWORD, cpf: adminCpf },
  });

  const loginRes = await ctx.post(`${BASE_API}/login`, {
    data: { email: adminEmail, senha: ADMIN_PASSWORD },
  });

  const body = await loginRes.json().catch(() => ({}));
  adminToken = body.token ?? '';
  if (!adminToken) throw new Error('Falha ao autenticar admin para suite de categorias');

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
    if (!adminToken || !rb.user?.isAdmin) {
      throw new Error('Falha ao promover admin para suite de categorias');
    }
  }

  await ctx.dispose();
});

test.describe('Categorias - CRUD Completo', () => {
  
  
  test('deve executar CRUD completo de categoria com sucesso e falhas no mesmo cenário', async ({ page, request }) => {
    await page.goto('/auth');
    await page.locator('#login-email').fill(adminEmail);
    await page.locator('#login-password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.goto('/admin/operations/categories');
    await expect(page.getByRole('heading', { name: /Categorias de Livros/i })).toBeVisible({ timeout: 10000 });

    const categoryName = `Categoria E2E ${Date.now()}`;
    await page.getByRole('button', { name: /Novo/i }).click();
    await expect(page).toHaveURL(/\/admin\/operations\/categories\/new/, { timeout: 8000 });
    await page.getByRole('textbox').first().fill(categoryName);
    await page.getByRole('button', { name: /Salvar/i }).click();

    await expect(page).toHaveURL('/admin/operations/categories', { timeout: 10000 });
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 10000 });

    const createdRow = page.locator('div.flex.items-center.justify-between.border.rounded.p-3').filter({
      has: page.getByText(categoryName),
    });
    await createdRow.getByRole('button').first().click();

    await expect(page).toHaveURL(/\/admin\/operations\/categories\/edit\//, { timeout: 8000 });
    const input = page.getByRole('textbox').first();
    await expect(input).toHaveValue(categoryName, { timeout: 8000 });

    const updatedName = `${categoryName} Editada`;
    await input.clear();
    await input.fill(updatedName);
    await page.getByRole('button', { name: /Salvar/i }).click();

    await expect(page).toHaveURL('/admin/operations/categories', { timeout: 10000 });
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 });

    const updatedRow = page.locator('div.flex.items-center.justify-between.border.rounded.p-3').filter({
      has: page.getByText(updatedName),
    });

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await updatedRow.getByRole('button').nth(1).click();

    await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 10000 });

    const semAuth = await request.post(`${BASE_API}/categories`, {
      data: { name: 'Categoria sem auth' },
    });
    expect(semAuth.status()).toBe(401);

    const semNome = await request.post(`${BASE_API}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {},
    });
    expect(semNome.status()).toBe(400);

    const editarInexistente = await request.put(`${BASE_API}/categories/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { name: 'Inexistente' },
    });
    expect(editarInexistente.status()).toBe(404);

    const excluirInexistente = await request.delete(`${BASE_API}/categories/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(excluirInexistente.status()).toBe(404);
  });
});
