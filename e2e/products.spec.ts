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

// ─── Setup: criar e promover utilizador admin via API ────────────────────────
test.beforeAll(async () => {
  const seed = Date.now();
  adminEmail = `admin_ui_${seed}@teste.local`;
  const adminCpf = gerarCpfValido(seed);

  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });

  await ctx.post(`${BASE_API}/register`, {
    data: { nome: 'Admin UI E2E', email: adminEmail, senha: ADMIN_PASSWORD, cpf: adminCpf },
  });

  const loginRes = await ctx.post(`${BASE_API}/login`, {
    data: { email: adminEmail, senha: ADMIN_PASSWORD },
  });
  const body = await loginRes.json().catch(() => ({}));
  adminToken = body.token ?? '';
  if (!adminToken) throw new Error('Falha ao autenticar admin');

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

// ─── CRUD completo via UI: cadastrar → listar → editar → excluir ─────────────
test.describe('Produtos - CRUD Completo via UI (Admin)', () => {
  // [RUBRICA: E2E_CRUD_1_PRODUTOS_SUCESSO_COMPLETO]
  // [RUBRICA: E2E_CRUD_1_PRODUTOS_FALHAS]
  test('deve executar CRUD completo de produto com sucesso e falhas no mesmo cenário', async ({ page, request }) => {
    // 1. LOGIN via interface gráfica
    await page.goto('/auth');
    await page.locator('#login-email').fill(adminEmail);
    await page.locator('#login-password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // 2. NAVEGAR para painel de produtos
    await page.goto('/admin/products');
    await expect(page.getByRole('heading', { name: /Produtos/i })).toBeVisible({ timeout: 8000 });

    // 3. CADASTRAR — clicar em "Novo Produto" e preencher formulário
    await page.getByRole('button', { name: /Novo Produto/i }).click();
    await expect(page).toHaveURL(/\/admin\/products\/new/, { timeout: 8000 });

    const productName = `Produto UI E2E ${Date.now()}`;
    await page.getByRole('textbox').first().fill(productName);
    await page.locator('input[type="number"]').first().fill('49.90');
    // Selector "Formato" já pré-seleccionado como "Digital" — manter como está
    await page.getByRole('button', { name: /Salvar/i }).click();

    // Aguardar regresso à listagem
    await expect(page).toHaveURL('/admin/products', { timeout: 10000 });

    // 4. LISTAR — confirmar que o produto aparece na listagem
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10000 });

    // 5. EDITAR — clicar no botão de edição dentro do card do produto
    const productCard = page
      .locator('[class*="overflow-hidden"]')
      .filter({ has: page.locator('h3', { hasText: productName }) });
    await expect(productCard).toBeVisible({ timeout: 8000 });
    // Primeiro botão icon dentro do card = Editar (lápis)
    await productCard.getByRole('button').first().click();
    await expect(page).toHaveURL(/\/admin\/products\/edit\//, { timeout: 8000 });

    const updatedName = `${productName} EDITADO`;
    const nameInput = page.getByRole('textbox').first();
    await nameInput.clear();
    await nameInput.fill(updatedName);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page).toHaveURL('/admin/products', { timeout: 10000 });
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 });

    // 6. EXCLUIR — clicar no botão de remoção e confirmar no AlertDialog
    const updatedCard = page
      .locator('[class*="overflow-hidden"]')
      .filter({ has: page.locator('h3', { hasText: updatedName }) });
    await expect(updatedCard).toBeVisible({ timeout: 8000 });
    // Segundo botão icon dentro do card = Excluir (lixeira)
    await updatedCard.getByRole('button').nth(1).click();
    // AlertDialog — confirmar clicando no botão destrutivo
    await page.getByRole('button', { name: /Excluir/i }).last().click();

    // 7. CONFIRMAR exclusão — produto não deve mais aparecer
    await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 10000 });

    // 8. FALHAS — validar regras de erro no mesmo cenário (via API)
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
