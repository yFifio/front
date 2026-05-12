import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Checkout from '@/pages/Checkout';
import type { Product } from '@/types';

const {
  navigateMock,
  clearCartMock,
  apiRequestMock,
  toastMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  clearCartMock: vi.fn(),
  apiRequestMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

let mockUser: { id: number; email: string } | null = { id: 1, email: 'cliente@teste.com' };
let mockItems: Array<{ product: Product; quantity: number }> = [];

const productDigital: Product = {
  id: 'd1',
  name: 'Livro Digital',
  description: null,
  price: 100,
  image_url: null,
  age_range: null,
  category: 'digital',
  is_active: true,
  discount_percent: 0,
  is_featured: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@mercadopago/sdk-react', () => ({
  initMercadoPago: vi.fn(),
  Wallet: ({ initialization }: { initialization: { preferenceId: string } }) => (
    <div>wallet-{initialization.preferenceId}</div>
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: mockItems,
    getTotalPrice: () => mockItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
    clearCart: clearCartMock,
  }),
}));

vi.mock('@/lib/api', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

vi.mock('@/components/checkout/DeliveryAddressForm', () => ({
  default: ({
    setAddress,
    setCity,
    setState,
    setZip,
    setPhone,
  }: {
    setAddress: (value: string) => void;
    setCity: (value: string) => void;
    setState: (value: string) => void;
    setZip: (value: string) => void;
    setPhone: (value: string) => void;
  }) => (
    <div>
      <button onClick={() => {
        setAddress('Rua 1');
        setCity('SP');
        setState('SP');
        setZip('01000-000');
        setPhone('11999999999');
      }}>
        preencher-endereco
      </button>
    </div>
  ),
}));

describe('Checkout page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockUser = { id: 1, email: 'cliente@teste.com' };
    mockItems = [{ product: productDigital, quantity: 1 }];
  });

  it('renders login required state when user is not authenticated', () => {
    mockUser = null;

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    expect(screen.getByText('Login necessário')).toBeInTheDocument();
  });

  it('renders empty cart state when no items', () => {
    mockItems = [];

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    expect(screen.getByText('Carrinho vazio!')).toBeInTheDocument();
  });

  it('applies coupon and allows removing it', async () => {
    apiRequestMock.mockResolvedValueOnce({ code: 'LIVRO10', discount: 10 });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Ex: LIVRO10'), {
      target: { value: 'livro10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith('/coupons/validate', expect.any(Object));
      expect(screen.getByText(/Cupom aplicado: /i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(screen.queryByText(/Cupom aplicado: /i)).not.toBeInTheDocument();
  });

  it('submits checkout and redirects to order-success when preference_id returned without init_point', async () => {
    apiRequestMock.mockResolvedValueOnce({ preference_id: 'pref-123', orderId: 42 });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Nome Completo'), {
      target: { value: 'Cliente Teste' },
    });
    fireEvent.change(screen.getByLabelText('CPF'), {
      target: { value: '52998224725' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Pagar R\$/i }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith('/orders', expect.any(Object));
    });

    await waitFor(() => {
      expect(clearCartMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/order-success?order_id=42');
    });
  });
});
