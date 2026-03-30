import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '@/pages/admin/Dashboard';
import Products from '@/pages/admin/Products';
import Users from '@/pages/admin/Users';
import Orders from '@/pages/admin/Orders';
import Operations from '@/pages/admin/Operations';
import ProductFormPage from '@/pages/admin/ProductFormPage';
import OperationsListPage from '@/pages/admin/OperationsListPage';
import OperationFormPage from '@/pages/admin/OperationFormPage';

const { navigateMock, apiRequestMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  apiRequestMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/lib/api', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

vi.mock('@/components/admin/ProductForm', () => ({
  ProductForm: () => <div>product-form-mock</div>,
}));

vi.mock('@/components/admin/SupplierForm', () => ({ SupplierForm: () => <div>supplier-form-mock</div> }));
vi.mock('@/components/admin/CategoryForm', () => ({ CategoryForm: () => <div>category-form-mock</div> }));
vi.mock('@/components/admin/CouponForm', () => ({ CouponForm: () => <div>coupon-form-mock</div> }));
vi.mock('@/components/admin/UserForm', () => ({ UserForm: () => <div>user-form-mock</div> }));

const renderWithProviders = (ui: React.ReactNode, route = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('admin pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiRequestMock.mockImplementation((endpoint: string) => {
      if (endpoint.includes('/products?limit=200')) {
        return Promise.resolve({ data: [{ id: 'p1' }, { id: 'p2' }] });
      }

      if (endpoint.includes('/products?limit=100')) {
        return Promise.resolve({
          data: [
            {
              id: 'p1',
              name: 'Livro Admin',
              description: null,
              price: 49.9,
              image_url: null,
              age_range: null,
              category: 'digital',
              is_active: true,
              discount_percent: 0,
              is_featured: false,
              created_at: '2026-01-01',
              updated_at: '2026-01-01',
            },
          ],
        });
      }

      if (endpoint === '/users') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              nome: 'Admin User',
              email: 'admin@teste.com',
              cpf: '52998224725',
              isAdmin: true,
            },
          ],
        });
      }

      if (endpoint === '/orders') {
        return Promise.resolve({
          data: [
            {
              id: 'o1',
              customer_name: 'Cliente 1',
              customer_email: 'cliente@teste.com',
              total_price: 120,
              status: 'paid',
              created_at: '2026-03-01T10:00:00.000Z',
              order_items: [
                {
                  id: 'i1',
                  product_name: 'Produto A',
                  quantity: 1,
                  price_at_purchase: 120,
                  product_id: 'p1',
                  products: { category: 'digital' },
                },
              ],
              delivery_address: null,
              delivery_city: null,
              delivery_state: null,
              delivery_zip: null,
              delivery_phone: null,
              tracking_code: null,
            },
          ],
        });
      }

      if (endpoint.startsWith('/products/')) {
        return Promise.resolve({
          id: 'p1',
          name: 'Produto Editar',
          description: null,
          price: 10,
          image_url: null,
          age_range: null,
          category: 'digital',
          is_active: true,
          discount_percent: 0,
          is_featured: false,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        });
      }

      if (endpoint.startsWith('/suppliers?')) {
        return Promise.resolve({ data: [{ id: 1, name: 'Fornecedor A', email: 'f@a.com' }], total: 1 });
      }

      if (endpoint.startsWith('/suppliers/1')) {
        return Promise.resolve({ id: 1, name: 'Fornecedor A', email: 'f@a.com' });
      }

      return Promise.resolve({ data: [] });
    });
  });

  it('renders admin dashboard stats and recent orders', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument();
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    });
  });

  it('renders operations page modules', () => {
    renderWithProviders(<Operations />);

    expect(screen.getByText('Operações')).toBeInTheDocument();
    expect(screen.getByText('Fornecedores')).toBeInTheDocument();
    expect(screen.getByText('Categorias de Livros')).toBeInTheDocument();
    expect(screen.getByText('Cupons')).toBeInTheDocument();
  });

  it('renders products admin list', async () => {
    renderWithProviders(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Produtos')).toBeInTheDocument();
      expect(screen.getByText('Livro Admin')).toBeInTheDocument();
    });
  });

  it('renders users admin list', async () => {
    renderWithProviders(<Users />);

    await waitFor(() => {
      expect(screen.getByText('Usuários')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('renders orders admin list', async () => {
    renderWithProviders(<Orders />);

    await waitFor(() => {
      expect(screen.getByText('Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    });
  });

  it('renders product form page (new)', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/products/new" element={<ProductFormPage />} />
      </Routes>,
      '/admin/products/new'
    );

    await waitFor(() => {
      expect(screen.getByText('Novo Produto')).toBeInTheDocument();
      expect(screen.getByText('product-form-mock')).toBeInTheDocument();
    });
  });

  it('renders operations list page with valid resource', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/operations/:resource" element={<OperationsListPage />} />
      </Routes>,
      '/admin/operations/suppliers'
    );

    await waitFor(() => {
      expect(screen.getByText('Fornecedores')).toBeInTheDocument();
      expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
    });
  });

  it('renders operation form page with invalid resource message', () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/operations/:resource/edit/:id" element={<OperationFormPage />} />
      </Routes>,
      '/admin/operations/unknown/edit/1'
    );

    expect(screen.getByText('Recurso inválido.')).toBeInTheDocument();
  });
});
