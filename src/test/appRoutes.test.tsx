import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';

const applyStoreThemeMock = vi.fn();
const getStoredStoreThemeMock = vi.fn(() => ({ mode: 'default' }));

vi.mock('@/lib/storeTheme', () => ({
  applyStoreTheme: (...args: unknown[]) => applyStoreThemeMock(...args),
  getStoredStoreTheme: () => getStoredStoreThemeMock(),
}));

vi.mock('@/components/PsychedelicOverlay', () => ({ PsychedelicOverlay: () => <div>overlay</div> }));
vi.mock('@/components/StarCursor', () => ({ StarCursor: () => <div>cursor</div> }));

vi.mock('@/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/pages/Index', () => ({ default: () => <div>pagina-inicial</div> }));
vi.mock('@/pages/Auth', () => ({ default: () => <div>pagina-auth</div> }));
vi.mock('@/pages/Checkout', () => ({ default: () => <div>pagina-checkout</div> }));
vi.mock('@/pages/OrderSuccess', () => ({ default: () => <div>pagina-order-success</div> }));
vi.mock('@/pages/MyOrders', () => ({ default: () => <div>pagina-my-orders</div> }));
vi.mock('@/pages/MyDownloads', () => ({ default: () => <div>pagina-my-downloads</div> }));
vi.mock('@/pages/Profile', () => ({ default: () => <div>pagina-profile</div> }));
vi.mock('@/pages/ColorirLoja', () => ({ default: () => <div>pagina-colorir</div> }));
vi.mock('@/pages/NotFound', () => ({ default: () => <div>pagina-not-found</div> }));

vi.mock('@/components/admin/AdminLayout', () => ({
  AdminLayout: () => <div>admin-layout</div>,
}));
vi.mock('@/pages/admin/Dashboard', () => ({ default: () => <div>admin-dashboard</div> }));
vi.mock('@/pages/admin/Products', () => ({ default: () => <div>admin-products</div> }));
vi.mock('@/pages/admin/Orders', () => ({ default: () => <div>admin-orders</div> }));
vi.mock('@/pages/admin/Users', () => ({ default: () => <div>admin-users</div> }));
vi.mock('@/pages/admin/Operations', () => ({ default: () => <div>admin-operations</div> }));
vi.mock('@/pages/admin/Settings', () => ({ default: () => <div>admin-settings</div> }));
vi.mock('@/pages/admin/ProductFormPage', () => ({ default: () => <div>admin-product-form</div> }));
vi.mock('@/pages/admin/OperationsListPage', () => ({ default: () => <div>admin-operations-list</div> }));
vi.mock('@/pages/admin/OperationFormPage', () => ({ default: () => <div>admin-operation-form</div> }));

describe('App routes composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('renders home route and initializes theme', () => {
    render(<App />);

    expect(screen.getByText('pagina-inicial')).toBeInTheDocument();
    expect(applyStoreThemeMock).toHaveBeenCalledWith({ mode: 'default' });
  });
});
