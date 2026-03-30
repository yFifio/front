import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartStore {
  sessionKey: string;
  carts: Record<string, CartItem[]>;
  items: CartItem[];
  setCartSession: (userId: number | null | undefined) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  syncProducts: (products: Product[]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const resolveSessionKey = (userId: number | null | undefined) => {
  if (userId == null) return 'guest';
  return `user:${Number(userId)}`;
};

try {
  var useCart = create<CartStore>()(
    persist(
      (set, get) => ({
        sessionKey: 'guest',
        carts: { guest: [] },
        items: [],

        setCartSession: (userId: number | null | undefined) => {
          const nextSessionKey = resolveSessionKey(userId);
          const state = get();
          if (state.sessionKey === nextSessionKey) {
            return;
          }

          const nextItems = state.carts[nextSessionKey] || [];

          set({
            sessionKey: nextSessionKey,
            items: nextItems,
          });
        },
        
        addItem: (product: Product) => {
          set((state) => {
            const sessionItems = state.carts[state.sessionKey] || [];
            const existingItem = sessionItems.find(item => item.product.id === product.id);
            let updatedItems: CartItem[];

            if (existingItem) {
              updatedItems = sessionItems.map(item =>
                  item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                );
            } else {
              updatedItems = [...sessionItems, { product, quantity: 1 }];
            }

            return {
              carts: {
                ...state.carts,
                [state.sessionKey]: updatedItems,
              },
              items: updatedItems,
            };
          });
        },
        
        removeItem: (productId: string) => {
          set((state) => {
            const sessionItems = state.carts[state.sessionKey] || [];
            const updatedItems = sessionItems.filter(item => item.product.id !== productId);

            return {
              carts: {
                ...state.carts,
                [state.sessionKey]: updatedItems,
              },
              items: updatedItems,
            };
          });
        },
        
        updateQuantity: (productId: string, quantity: number) => {
          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }
          set((state) => {
            const sessionItems = state.carts[state.sessionKey] || [];
            const updatedItems = sessionItems.map(item =>
              item.product.id === productId ? { ...item, quantity } : item
            );

            return {
              carts: {
                ...state.carts,
                [state.sessionKey]: updatedItems,
              },
              items: updatedItems,
            };
          });
        },

        syncProducts: (products: Product[]) => {
          if (!products.length) return;
          const byId = new Map(products.map((p) => [String(p.id), p]));
          set((state) => {
            const sessionItems = state.carts[state.sessionKey] || [];
            const updatedItems = sessionItems.map((item) => {
              const latest = byId.get(String(item.product.id));
              if (!latest) return item;
              return { ...item, product: { ...item.product, ...latest } };
            });

            return {
              carts: {
                ...state.carts,
                [state.sessionKey]: updatedItems,
              },
              items: updatedItems,
            };
          });
        },
        
        clearCart: () => set((state) => ({
          carts: {
            ...state.carts,
            [state.sessionKey]: [],
          },
          items: [],
        })),
        
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
    sessionKey: 'guest',
    carts: { guest: [] },
    items: [],
    setCartSession: () => {},
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
