import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Auth from '../pages/Auth';
import { vi } from 'vitest';

const signInMock = vi.fn();
const signUpMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    signIn: signInMock,
    signUp: signUpMock,
    signOut: vi.fn(),
  }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('Auth flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('faz login e redireciona para área logada', async () => {
    signInMock.mockResolvedValueOnce({
      user: { id: 1, nome: 'Lucas', email: 'lucas@teste.com', isAdmin: false },
      error: null,
    });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'lucas@teste.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'SenhaSegura1' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('lucas@teste.com', 'SenhaSegura1');
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('quando login falha mantém usuário na tela e não redireciona', async () => {
    signInMock.mockResolvedValueOnce({ user: null, error: new Error('Credenciais inválidas') });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'erro@teste.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senhaErrada1' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('erro@teste.com', 'senhaErrada1');
      expect(navigateMock).not.toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
