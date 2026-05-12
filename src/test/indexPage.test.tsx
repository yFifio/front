import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import Index from '@/pages/Index';
import type { Product } from '@/types';

const navigateMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

const addItemMock = vi.fn();
const updateQuantityMock = vi.fn();
const removeItemMock = vi.fn();
const syncProductsMock = vi.fn();

let cartItems: Array<{ product: Product; quantity: number }> = [];

const digitalProducts: Product[] = [
  {
    id: 'd1',
    name: 'Livro Digital A',
    description: null,
    price: 30,
    image_url: null,
    age_range: null,
    category: 'digital',
    book_category: 'Infantil',
    is_active: true,
    discount_percent: 0,
    is_featured: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

const physicalProducts: Product[] = [
  {
    id: 'p1',
    name: 'Livro Físico B',
    description: null,
    price: 50,
    image_url: null,
    age_range: null,
    category: 'physical',
    book_category: 'Clássicos',
    is_active: true,
    discount_percent: 0,
    is_featured: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [{ name: 'Infantil' }, { name: 'Clássicos' }] }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileInView: _whileInView, viewport: _viewport, transition: _transition, ...props }: React.HTMLAttributes<HTMLDivElement> & { whileInView?: unknown; viewport?: unknown; transition?: unknown }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: (category: 'digital' | 'physical') => ({
    data: category === 'digital' ? digitalProducts : physicalProducts,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: cartItems,
    addItem: addItemMock,
    updateQuantity: updateQuantityMock,
    removeItem: removeItemMock,
    syncProducts: syncProductsMock,
    getTotalItems: () => cartItems.reduce((total, item) => total + item.quantity, 0),
    getTotalPrice: () => cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
  }),
}));

vi.mock('@/components/store/HeroSection', () => ({
  HeroSection: ({ onExplore, onCartClick }: { onExplore: () => void; onCartClick: () => void }) => (
    <div>
      <button onClick={onExplore}>explorar</button>
      <button onClick={onCartClick}>abrir-carrinho</button>
    </div>
  ),
}));

vi.mock('@/components/store/ProductGrid', () => ({
  ProductGrid: ({ products, onAddToCart }: { products: Product[]; onAddToCart: (p: Product) => void }) => (
    <div>
      <div data-testid="grid-count">{products.length}</div>
      {products.map((product) => (
        <button key={product.id} onClick={() => onAddToCart(product)}>
          add-{product.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/components/store/CartSheet', () => ({
  CartSheet: ({ open, onCheckout }: { open: boolean; onCheckout: () => void }) => (
    <div>
      <span>{open ? 'cart-open' : 'cart-closed'}</span>
      <button onClick={onCheckout}>checkout</button>
    </div>
  ),
}));

vi.mock('@/components/store/WhatsAppButton', () => ({ WhatsAppButton: () => <div>whats</div> }));
vi.mock('@/components/store/Footer', () => ({ Footer: () => <div>footer</div> }));
vi.mock('@/components/store/PsychedelicExperience', () => ({ PsychedelicExperience: () => <div>psy</div> }));
vi.mock('@/components/store/ScrollToTopButton', () => ({ ScrollToTopButton: () => <div>top</div> }));

describe('Index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cartItems = [];
  });

  it('renders featured products and adds item to cart', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    expect(screen.getByText('Em Destaque')).toBeInTheDocument();
    fireEvent.click(screen.getByText('add-Livro Digital A'));

    expect(addItemMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it('shows cart empty error on checkout when no items', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('abrir-carrinho'));
    fireEvent.click(screen.getByText('checkout'));

    expect(toastErrorMock).toHaveBeenCalledWith('Seu carrinho está vazio!');
    expect(navigateMock).not.toHaveBeenCalledWith('/checkout');
  });

  it('navigates to checkout when cart has items', () => {
    cartItems = [{ product: digitalProducts[0], quantity: 1 }];

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('abrir-carrinho'));
    fireEvent.click(screen.getByText('checkout'));

    expect(navigateMock).toHaveBeenCalledWith('/checkout');
  });
});
