import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  syncProducts: (products: Product[]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

try {
  var useCart = create<CartStore>()(
    persist(
      (set, get) => ({
        items: [],
        
        addItem: (product: Product) => {
          set((state) => {
            const existingItem = state.items.find(item => item.product.id === product.id);
            if (existingItem) {
              return {
                items: state.items.map(item =>
                  item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                ),
              };
            }
            return { items: [...state.items, { product, quantity: 1 }] };
          });
        },
        
        removeItem: (productId: string) => {
          set((state) => ({
            items: state.items.filter(item => item.product.id !== productId),
          }));
        },
        
        updateQuantity: (productId: string, quantity: number) => {
          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }
          set((state) => ({
            items: state.items.map(item =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          }));
        },

        syncProducts: (products: Product[]) => {
          if (!products.length) return;
          const byId = new Map(products.map((p) => [String(p.id), p]));
          set((state) => ({
            items: state.items.map((item) => {
              const latest = byId.get(String(item.product.id));
              if (!latest) return item;
              return { ...item, product: { ...item.product, ...latest } };
            }),
          }));
        },
        
        clearCart: () => set({ items: [] }),
        
        getTotalItems: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },
        
        getTotalPrice: () => {
          return get().items.reduce(
            (total, item) => {
              const itemDiscount = item.product.discount_percent || 0;
              const unitPrice = item.product.price * (1 - itemDiscount / 100);
              return total + unitPrice * item.quantity;
            },
            0
          );
        },
      }),
      {
        name: 'kids-ebooks-cart',
      }
    )
  );
} catch (e) {
  console.error('Erro ao criar useCart:', e);
  useCart = create<CartStore>((set, get) => ({
    items: [],
    addItem: () => {},
    removeItem: () => {},
    updateQuantity: () => {},
    syncProducts: () => {},
    clearCart: () => {},
    getTotalItems: () => 0,
    getTotalPrice: () => 0,
  }));
}

export { useCart };
