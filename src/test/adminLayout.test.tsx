import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminLayout } from '@/components/admin/AdminLayout';

const navigateMock = vi.fn();
const signOutMock = vi.fn();

let mockAuthState: {
  user: { id: number; nome: string; email: string } | null;
  isLoading: boolean;
} = {
  user: { id: 1, nome: 'Admin Teste', email: 'admin@teste.com' },
  isLoading: false,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    isLoading: mockAuthState.isLoading,
    signOut: signOutMock,
  }),
}));

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: { id: 1, nome: 'Admin Teste', email: 'admin@teste.com' },
      isLoading: false,
    };
  });

  it('renders admin navigation when authenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>conteudo-admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Produtos')).toBeInTheDocument();
      expect(screen.getByText('Usuários')).toBeInTheDocument();
      expect(screen.getByText('Operações')).toBeInTheDocument();
      expect(screen.getByText('Pedidos')).toBeInTheDocument();
      expect(screen.getByText('conteudo-admin')).toBeInTheDocument();
    });
  });

  it('redirects to auth when user is not logged', async () => {
    mockAuthState = {
      user: null,
      isLoading: false,
    };

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>conteudo-admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/auth', { state: { from: '/admin' } });
    });
  });

  it('signs out and navigates to home', async () => {
    signOutMock.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>conteudo-admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sair do Sistema')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sair do Sistema'));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });
});
