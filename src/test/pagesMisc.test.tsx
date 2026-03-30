import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import OrderSuccess from '@/pages/OrderSuccess';
import ColorirLoja from '@/pages/ColorirLoja';

const {
  navigateMock,
  updateProfileMock,
  apiRequestMock,
  clearCartMock,
  toast,
  applyStoreThemeMock,
  clearStoredStoreThemeMock,
  createRandomStoreThemeMock,
  saveStoreThemeMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  updateProfileMock: vi.fn(),
  apiRequestMock: vi.fn(),
  clearCartMock: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  applyStoreThemeMock: vi.fn(),
  clearStoredStoreThemeMock: vi.fn(),
  createRandomStoreThemeMock: vi.fn(),
  saveStoreThemeMock: vi.fn(),
}));

let mockUser: { nome?: string; email: string; cpf?: string } | null = {
  nome: 'Lucas',
  email: 'lucas@teste.com',
  cpf: '52998224725',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({ toast }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    updateProfile: updateProfileMock,
  }),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    clearCart: clearCartMock,
  }),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/lib/storeTheme', () => ({
  applyStoreTheme: (...args: unknown[]) => applyStoreThemeMock(...args),
  clearStoredStoreTheme: (...args: unknown[]) => clearStoredStoreThemeMock(...args),
  createRandomStoreTheme: () => createRandomStoreThemeMock(),
  defaultStoreTheme: {
    primary: '220 50% 50%',
    secondary: '280 40% 45%',
    accent: '30 90% 50%',
    ebook: '160 70% 40%',
    coloring: '320 70% 50%',
  },
  getStoredStoreTheme: () => ({
    primary: '220 50% 50%',
    secondary: '280 40% 45%',
    accent: '30 90% 50%',
    ebook: '160 70% 40%',
    coloring: '320 70% 50%',
  }),
  hslTripletToHex: (value: string) => {
    if (value.includes('220')) return '#3366cc';
    if (value.includes('280')) return '#8a2be2';
    if (value.includes('30')) return '#ff8c00';
    if (value.includes('160')) return '#2e8b57';
    return '#ff1493';
  },
  hexToHslTriplet: () => '220 50% 50%',
  saveStoreTheme: (...args: unknown[]) => saveStoreThemeMock(...args),
  storeThemeSections: [
    {
      title: 'Cores principais',
      description: 'Personalize sua loja',
      fields: [
        { key: 'primary', label: 'Primária', hint: 'Cor principal' },
      ],
    },
  ],
}));

describe('misc pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      nome: 'Lucas',
      email: 'lucas@teste.com',
      cpf: '52998224725',
    };
    createRandomStoreThemeMock.mockReturnValue({
      primary: '100 50% 50%',
      secondary: '200 50% 50%',
      accent: '300 50% 50%',
      ebook: '120 50% 50%',
      coloring: '340 50% 50%',
    });
  });

  it('renders NotFound and navigates using action buttons', () => {
    render(
      <MemoryRouter initialEntries={['/rota-inexistente']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Página não encontrada')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Voltar'));
    fireEvent.click(screen.getByText('Ir para a loja'));

    expect(navigateMock).toHaveBeenCalledWith(-1);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('validates and updates profile', async () => {
    updateProfileMock.mockResolvedValueOnce({ error: null });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'SenhaA1' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'SenhaDiferente1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    expect(toast.error).toHaveBeenCalledWith('As senhas não coincidem');

    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'SenhaA1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!');
    });
  });

  it('clears cart when OrderSuccess is mounted with order id', async () => {
    apiRequestMock
      .mockResolvedValueOnce({ status: 'paid' })
      .mockResolvedValueOnce({ order_status: 'pending' });

    render(
      <MemoryRouter initialEntries={['/order-success?order_id=10']}>
        <OrderSuccess />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(clearCartMock).toHaveBeenCalled();
      expect(apiRequestMock).toHaveBeenCalled();
    });
  });

  it('renders ColorirLoja and handles randomize/reset actions', () => {
    render(
      <MemoryRouter>
        <ColorirLoja />
      </MemoryRouter>
    );

    expect(screen.getByText('Pinte a loja do seu jeito')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Surpresa divertida'));
    fireEvent.click(screen.getByText('Restaurar cores'));

    expect(createRandomStoreThemeMock).toHaveBeenCalled();
    expect(clearStoredStoreThemeMock).toHaveBeenCalled();
    expect(applyStoreThemeMock).toHaveBeenCalled();
    expect(saveStoreThemeMock).toHaveBeenCalled();
  });
});
