import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import { vi } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Admin' }, isAdmin: true, isLoading: false }),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(() => Promise.resolve([])),
}));

describe('AdminDashboard component', () => {
  it('renders dashboard and navigates to operations showing three useful cards', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByText(/Carregando Painel/i)).not.toBeInTheDocument());

    expect(screen.getByRole('heading', { name: /Produtos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Usuários/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Operações/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/Operações/i)[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Fornecedores/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Categorias de Livros/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Cupons/i })).toBeInTheDocument();
    });

    const novoButtons = screen.getAllByRole('button', { name: /Novo/i });
    expect(novoButtons.length).toBe(3);
  });
});
