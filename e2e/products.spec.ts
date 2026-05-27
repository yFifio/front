import { test, expect, request } from '@playwright/test';

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

let adminToken = '';
let adminEmail = '';
let adminCpf = '';

test.beforeAll(async () => {
  const ctx = await request.newContext({ ignoreHTTPSErrors: true });
  const seed = Date.now();
  adminEmail = `admin_e2e_${seed}@teste.local`;
  adminCpf = gerarCpfValido(seed);

  await ctx.post(`${BASE_API}/register`, {
    data: {
      nome: 'Admin E2E Produtos',
      email: adminEmail,
      senha: ADMIN_PASSWORD,
      cpf: adminCpf,
    },
  });

  const loginRes = await ctx.post(`${BASE_API}/login`, {
    data: { email: adminEmail, senha: ADMIN_PASSWORD },
  });

  const body = await loginRes.json().catch(() => ({}));
  adminToken = body.token ?? '';

  if (!adminToken) {
    throw new Error('Falha ao autenticar usuário admin E2E');
  }

  if (!body.user?.isAdmin) {
    await ctx.put(`${BASE_API}/users/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isAdmin: true },
    });

    const reloginRes = await ctx.post(`${BASE_API}/login`, {
      data: { email: adminEmail, senha: ADMIN_PASSWORD },
    });
    const reloginBody = await reloginRes.json().catch(() => ({}));
    adminToken = reloginBody.token ?? '';

    if (!adminToken || !reloginBody.user?.isAdmin) {
      throw new Error('Não foi possível promover usuário E2E para admin');
    }
  }

  await ctx.dispose();
});

test.describe('Produtos - CRUD Completo (Admin)', () => {
  // ─── Cenário único: cadastrar → listar → editar → excluir ──────────────────
  test('deve cadastrar, listar, editar e excluir um produto no mesmo cenário', async ({ request }) => {
    const productName = `Produto E2E ${Date.now()}`;

    // 1. CADASTRAR
    const createRes = await request.post(`${BASE_API}/products`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: productName,
        description: 'Produto criado via teste E2E',
        price: 49.9,
        category: 'digital',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    const productId = createBody?.id ?? createBody?.product?.id;
    expect(productId).toBeTruthy();

    // 2. LISTAR — verificar que o produto criado aparece na listagem
    const listRes = await request.get(`${BASE_API}/products`, { ignoreHTTPSErrors: true });
    expect(listRes.ok()).toBeTruthy();
    const listPayload = await listRes.json();
    const list: Array<{ id: number }> = Array.isArray(listPayload)
      ? listPayload
      : (listPayload?.data ?? listPayload?.rows ?? []);
    expect(Array.isArray(list)).toBeTruthy();
    expect(list.some((p) => p.id === productId)).toBeTruthy();

    // 3. EDITAR
    const updatedName = `Editado E2E ${Date.now()}`;
    const updateRes = await request.put(`${BASE_API}/products/${productId}`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: updatedName,
        description: 'Produto editado via E2E',
        price: 29.9,
        category: 'digital',
      },
    });
    expect(updateRes.ok()).toBeTruthy();

    // 4. EXCLUIR
    const delRes = await request.delete(`${BASE_API}/products/${productId}`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.ok()).toBeTruthy();

    // 5. CONFIRMAR EXCLUSÃO — produto não deve mais aparecer
    const afterListRes = await request.get(`${BASE_API}/products`, { ignoreHTTPSErrors: true });
    expect(afterListRes.ok()).toBeTruthy();
    const afterPayload = await afterListRes.json();
    const afterList: Array<{ id: number }> = Array.isArray(afterPayload)
      ? afterPayload
      : (afterPayload?.data ?? afterPayload?.rows ?? []);
    expect(afterList.some((p) => p.id === productId)).toBeFalsy();
  });

  // ─── Casos de falha ─────────────────────────────────────────────────────────
  test('deve falhar ao criar produto sem autenticação (401)', async ({ request }) => {
    const res = await request.post(`${BASE_API}/products`, {
      ignoreHTTPSErrors: true,
      data: {
        name: 'Produto sem auth',
        description: 'Não deve ser criado',
        price: 10.0,
        category: 'digital',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('deve falhar ao criar produto com dados inválidos — name ausente (400)', async ({ request }) => {
    const res = await request.post(`${BASE_API}/products`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        // name ausente — campo obrigatório
        description: 'Produto sem nome',
        price: -1,
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('deve falhar ao editar produto inexistente (404)', async ({ request }) => {
    const res = await request.put(`${BASE_API}/products/999999`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { name: 'Inexistente', price: 1, category: 'digital' },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('deve falhar ao excluir produto inexistente (404)', async ({ request }) => {
    const res = await request.delete(`${BASE_API}/products/999999`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });
});
