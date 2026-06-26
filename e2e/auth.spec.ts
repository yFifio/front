import { test, expect, request as apiRequest } from '@playwright/test';

const BASE_API = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';
const TEST_EMAIL = 'fluxo_1778585735@teste.local';
const TEST_CPF = '20414454243';
const TEST_PASSWORD = 'Senha@123';

test.beforeAll(function () {
  return apiRequest.newContext({ ignoreHTTPSErrors: true }).then(function (ctx) {
    return ctx
      .post(BASE_API + '/register', {
        data: {
          nome: 'Usuario Fluxo',
          email: TEST_EMAIL,
          senha: TEST_PASSWORD,
          cpf: TEST_CPF,
        },
      })
      .catch(function () {
        return undefined;
      })
      .then(function () {
        return ctx.dispose();
      });
  });
});

test.describe('Autenticacao - Cadastro de Usuario', function () {
  test('deve criar conta com sucesso', async function ({ page }) {
    const timestamp = Date.now();
    const testEmail = 'e2e_' + timestamp + '@teste.local';
    
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Criar Conta' }).click();
    
    await page.locator('#signup-name').fill('Usuario E2E');
    await page.locator('#signup-cpf').fill(TEST_CPF);
    await page.locator('#signup-email').fill(testEmail);
    await page.locator('#signup-password').fill('Senha@123');
    await page.locator('#signup-confirm-password').fill('Senha@123');
    
    await page.getByRole('button', { name: /Criar Conta/i }).click();
    
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
  });

  test('deve falhar ao criar conta com email ja cadastrado', async function ({ page }) {
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Criar Conta' }).click();
    
    await page.locator('#signup-name').fill('Outro Usuario');
    await page.locator('#signup-cpf').fill('11111111112');
    await page.locator('#signup-email').fill(TEST_EMAIL);
    await page.locator('#signup-password').fill('Senha@123');
    await page.locator('#signup-confirm-password').fill('Senha@123');
    
    await page.getByRole('button', { name: /Criar Conta/i }).click();
    
    await expect(page).toHaveURL('/auth', { timeout: 8000 });
    await expect(page.getByRole('tab', { name: 'Criar Conta' })).toHaveAttribute('data-state', 'active', { timeout: 5000 });
  });
});

test.describe('Autenticacao - Login', function () {
  test('deve fazer login com sucesso', async function ({ page }) {
    await page.goto('/auth');
    
    await page.locator('#login-email').fill(TEST_EMAIL);
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