import { test, expect } from '@playwright/test';

// CPF fixo válido para criação de conta (muda a cada execução via timestamp no email)
function gerarCpfTeste(seed: number): string {
  const n = String(seed % 1000000000).padStart(9, '0').split('').map(Number);
  const d1Base = n.reduce((acc, digit, idx) => acc + digit * (10 - idx), 0);
  const d1 = d1Base % 11 < 2 ? 0 : 11 - (d1Base % 11);
  const d2Base = [...n, d1].reduce((acc, digit, idx) => acc + digit * (11 - idx), 0);
  const d2 = d2Base % 11 < 2 ? 0 : 11 - (d2Base % 11);
  return `${n.join('')}${d1}${d2}`;
}

test.describe('Autenticação - Cadastro de Usuário', () => {
  test('deve criar conta com sucesso', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_${timestamp}@teste.local`;
    const testCpf = gerarCpfTeste(timestamp);

    await page.goto('/auth');

    // Clicar na aba "Criar Conta"
    await page.getByRole('tab', { name: 'Criar Conta' }).click();

    // Preencher formulário de cadastro
    await page.locator('#signup-name').fill('Usuário E2E');
    await page.locator('#signup-cpf').fill(testCpf);
    await page.locator('#signup-email').fill(testEmail);
    await page.locator('#signup-password').fill('Senha@123');
    await page.locator('#signup-confirm-password').fill('Senha@123');

    // Submeter o formulário
    await page.getByRole('button', { name: /Criar Conta/i }).click();

    // Após cadastro com sucesso, o app permanece em /auth
    await expect(page).toHaveURL('/auth', { timeout: 10000 });
  });

  test('deve falhar ao criar conta com email já cadastrado', async ({ page }) => {
    await page.goto('/auth');

    // Email já existente no banco
    const emailExistente = 'fluxo_1778585735@teste.local';

    await page.getByRole('tab', { name: 'Criar Conta' }).click();

    // CPF diferente para não colidir no CPF
    await page.locator('#signup-name').fill('Outro Usuário');
    await page.locator('#signup-cpf').fill('11111111112');
    await page.locator('#signup-email').fill(emailExistente);
    await page.locator('#signup-password').fill('Senha@123');
    await page.locator('#signup-confirm-password').fill('Senha@123');

    await page.getByRole('button', { name: /Criar Conta/i }).click();

    // Deve exibir erro — permanecer na página /auth com aba de cadastro ainda ativa
    await expect(page).toHaveURL('/auth', { timeout: 8000 });
    // A aba Criar Conta continua ativa (não redirecionou para login)
    await expect(page.getByRole('tab', { name: 'Criar Conta' })).toHaveAttribute('data-state', 'active', { timeout: 5000 });
  });
});

test.describe('Autenticação - Login', () => {
  test('deve fazer login com sucesso', async ({ page }) => {
    await page.goto('/auth');

    // Aba Login é a padrão
    await page.locator('#login-email').fill('fluxo_1778585735@teste.local');
    await page.locator('#login-password').fill('Senha@123');

    await page.getByRole('button', { name: /Entrar/i }).click();

    // Deve redirecionar para home após login
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('deve falhar com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth');

    await page.locator('#login-email').fill('nao_existe_jamais@invalido.local');
    await page.locator('#login-password').fill('SenhaErradaTotal@999');

    await page.getByRole('button', { name: /Entrar/i }).click();

    // Deve permanecer na página de autenticação com aba login ativa
    await expect(page).toHaveURL('/auth', { timeout: 8000 });
    await expect(page.locator('#login-email')).toBeVisible();
  });
});
