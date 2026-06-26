import { test, expect, request as apiRequest } from '@playwright/test';

const BASE_API = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';
const TEST_PASSWORD = 'Senha@123';
let setupEmail = '';
let setupCpf = '';

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

test.beforeAll(async function () {
  const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });
  let autenticado = false;

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    setupEmail = `fluxo_${Date.now()}_${tentativa}_${Math.floor(Math.random() * 100000)}@teste.local`;
    setupCpf = gerarCpfValido();

    const registerResponse = await ctx.post(BASE_API + '/register', {
      data: {
        nome: 'Usuario Fluxo',
        email: setupEmail,
        senha: TEST_PASSWORD,
        cpf: setupCpf,
      },
    });

    if (![200, 201].includes(registerResponse.status())) {
      continue;
    }

    const loginResponse = await ctx.post(BASE_API + '/login', {
      data: { email: setupEmail, senha: TEST_PASSWORD },
    });

    if (loginResponse.status() === 200) {
      autenticado = true;
      break;
    }
  }

  if (!autenticado) {
    throw new Error('Não foi possível criar/autenticar usuário de setup para auth.spec');
  }

  await ctx.dispose();
});

test.describe('Autenticacao - Cadastro de Usuario', function () {
  test('deve criar conta com sucesso', async function ({ page, request }) {
    const testEmail = `e2e_${Date.now()}_${Math.floor(Math.random() * 100000)}@teste.local`;
    const testCpf = gerarCpfValido();
    
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Criar Conta' }).click();
    
    await page.locator('#signup-name').fill('Usuario E2E');
    await page.locator('#signup-cpf').fill(testCpf);
    await page.locator('#signup-email').fill(testEmail);
    await page.locator('#signup-password').fill('Senha@123');
    await page.locator('#signup-confirm-password').fill('Senha@123');

    const signupResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/register') && resp.request().method() === 'POST',
      { timeout: 12000 }
    );
    
    await page.getByRole('button', { name: /Criar Conta/i }).click();
    const signupResponse = await signupResponsePromise;
    expect(signupResponse.status()).toBe(201);
    
    await expect(page).toHaveURL('/auth', { timeout: 10000 });

    const loginApiResponse = await request.post(`${BASE_API}/login`, {
      data: { email: testEmail, senha: TEST_PASSWORD },
    });
    expect(loginApiResponse.status()).toBe(200);

    const loginBody = await loginApiResponse.json().catch(() => ({}));
    expect(loginBody?.token).toBeTruthy();
    expect(loginBody?.user?.email).toBe(testEmail);
  });

  test('deve falhar ao criar conta com email ja cadastrado', async function ({ page }) {
    const duplicateCpf = gerarCpfValido();
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Criar Conta' }).click();
    
    await page.locator('#signup-name').fill('Outro Usuario');
    await page.locator('#signup-cpf').fill(duplicateCpf);
    await page.locator('#signup-email').fill(setupEmail);
    await page.locator('#signup-password').fill('Senha@123');
    await page.locator('#signup-confirm-password').fill('Senha@123');

    const duplicateResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/register') && resp.request().method() === 'POST',
      { timeout: 12000 }
    );
    
    await page.getByRole('button', { name: /Criar Conta/i }).click();
    const duplicateResponse = await duplicateResponsePromise;
    expect([400, 409]).toContain(duplicateResponse.status());
    
    await expect(page).toHaveURL('/auth', { timeout: 8000 });
    await expect(page.getByRole('tab', { name: 'Criar Conta' })).toHaveAttribute('data-state', 'active', { timeout: 5000 });
  });
});

test.describe('Autenticacao - Login', function () {
  test('deve fazer login com sucesso', async function ({ page }) {
    await page.goto('/auth');
    
    await page.locator('#login-email').fill(setupEmail);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    
    await page.getByRole('button', { name: /Entrar/i }).click();
    
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('deve falhar com credenciais invalidas', async function ({ page }) {
    await page.goto('/auth');
    
    await page.locator('#login-email').fill('nao_existe_jamais@invalido.local');
    await page.locator('#login-password').fill('SenhaErradaTotal@999');
    
    await page.getByRole('button', { name: /Entrar/i }).click();
    
    await expect(page).toHaveURL('/auth', { timeout: 8000 });
    await expect(page.locator('#login-email')).toBeVisible();
  });
});