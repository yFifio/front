import { beforeEach, describe, expect, it } from 'vitest';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';

const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p-1',
  name: 'Livro Teste',
  description: 'Descrição',
  price: 100,
  image_url: null,
  age_range: null,
  category: 'digital',
  is_active: true,
  discount_percent: 0,
  is_featured: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('useCart store', () => {
  beforeEach(() => {
    useCart.setState({ items: [], sessionKey: 'guest', carts: { guest: [] } });
    localStorage.clear();
  });

  it('separates cart between guest and authenticated user', () => {
    const guestProduct = createProduct({ id: 'guest-1' });
    const userProduct = createProduct({ id: 'user-1' });

    useCart.getState().addItem(guestProduct);
    expect(useCart.getState().items).toHaveLength(1);

    useCart.getState().setCartSession(1);
    expect(useCart.getState().items).toHaveLength(0);

    useCart.getState().addItem(userProduct);
    expect(useCart.getState().items).toHaveLength(1);

    useCart.getState().setCartSession(null);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].product.id).toBe('guest-1');
  });

  it('separates cart between different authenticated users', () => {
    const user1Product = createProduct({ id: 'user-1-item' });
    const user2Product = createProduct({ id: 'user-2-item' });

    useCart.getState().setCartSession(1);
    useCart.getState().addItem(user1Product);
    expect(useCart.getState().items[0].product.id).toBe('user-1-item');

    useCart.getState().setCartSession(2);
    expect(useCart.getState().items).toHaveLength(0);

    useCart.getState().addItem(user2Product);
    expect(useCart.getState().items[0].product.id).toBe('user-2-item');

    useCart.getState().setCartSession(1);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].product.id).toBe('user-1-item');
  });

  it('keeps cart when session does not change', () => {
    const product = createProduct();

    useCart.getState().setCartSession(3);
    useCart.getState().addItem(product);
    useCart.getState().setCartSession(3);

    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().sessionKey).toBe('user:3');
  });

  it('adds item and increments quantity when same product is added again', () => {
    const product = createProduct();

    useCart.getState().addItem(product);
    useCart.getState().addItem(product);

    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('removes item by product id', () => {
    const productA = createProduct({ id: 'p-1' });
    const productB = createProduct({ id: 'p-2', name: 'Outro Livro' });

    useCart.getState().addItem(productA);
    useCart.getState().addItem(productB);
    useCart.getState().removeItem('p-1');

    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe('p-2');
  });

  it('updates quantity and removes item when quantity is zero or less', () => {
    const product = createProduct();
    useCart.getState().addItem(product);

    useCart.getState().updateQuantity(product.id, 3);
    expect(useCart.getState().items[0].quantity).toBe(3);

    useCart.getState().updateQuantity(product.id, 0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it('syncs product fields keeping cart quantity', () => {
    const product = createProduct({ id: 'p-1', price: 20, name: 'Antigo' });
    useCart.getState().addItem(product);
    useCart.getState().updateQuantity('p-1', 2);

    useCart.getState().syncProducts([
      createProduct({ id: 'p-1', price: 35, name: 'Atualizado' }),
    ]);

    const item = useCart.getState().items[0];
    expect(item.quantity).toBe(2);
    expect(item.product.name).toBe('Atualizado');
    expect(item.product.price).toBe(35);
  });

  it('calculates total items and total price with discount', () => {
    const discounted = createProduct({ id: 'p-1', price: 100, discount_percent: 10 });
    const normal = createProduct({ id: 'p-2', price: 50, discount_percent: 0 });

    useCart.getState().addItem(discounted);
    useCart.getState().addItem(normal);
    useCart.getState().addItem(normal);

    expect(useCart.getState().getTotalItems()).toBe(3);
    expect(useCart.getState().getTotalPrice()).toBe(190);
  });

  it('clears the cart', () => {
    useCart.getState().addItem(createProduct());
    expect(useCart.getState().items.length).toBeGreaterThan(0);

    useCart.getState().clearCart();
    expect(useCart.getState().items).toHaveLength(0);
  });
});
