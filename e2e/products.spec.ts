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
  test('deve criar um novo produto', async ({ request }) => {
    const productName = `Produto E2E ${Date.now()}`;
    const res = await request.post(`${BASE_API}/products`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: productName,
        description: 'Produto criado via teste E2E',
        price: 49.9,
        category: 'digital',
      },
    });

    expect(res.ok()).toBeTruthy();
    const payload = await res.json();
    expect(payload?.id ?? payload?.product?.id).toBeTruthy();
  });

  test('deve listar produtos existentes', async ({ request }) => {
    const res = await request.get(`${BASE_API}/products`, { ignoreHTTPSErrors: true });
    expect(res.ok()).toBeTruthy();

    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : (payload?.data ?? payload?.rows ?? []);
    expect(Array.isArray(list)).toBeTruthy();
  });

  test('deve editar um produto existente', async ({ request }) => {
    const created = await request.post(`${BASE_API}/products`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: `Editar E2E ${Date.now()}`,
        description: 'Produto para editar',
        price: 19.9,
        category: 'digital',
      },
    });

    expect(created.ok()).toBeTruthy();
    const createdBody = await created.json();
    const id = createdBody?.id ?? createdBody?.product?.id;
    expect(id).toBeTruthy();

    const updatedName = `Editado ${Date.now()}`;
    const updateRes = await request.put(`${BASE_API}/products/${id}`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: updatedName,
        description: 'Produto editado',
        price: 29.9,
        category: 'digital',
      },
    });

    expect(updateRes.ok()).toBeTruthy();
  });

  test('deve excluir um produto', async ({ request }) => {
    const created = await request.post(`${BASE_API}/products`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: `Excluir E2E ${Date.now()}`,
        description: 'Produto para excluir',
        price: 9.9,
        category: 'digital',
      },
    });

    expect(created.ok()).toBeTruthy();
    const createdBody = await created.json();
    const id = createdBody?.id ?? createdBody?.product?.id;
    expect(id).toBeTruthy();

    const delRes = await request.delete(`${BASE_API}/products/${id}`, {
      ignoreHTTPSErrors: true,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(delRes.ok()).toBeTruthy();
  });
});
