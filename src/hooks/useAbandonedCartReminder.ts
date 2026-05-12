import { useEffect, useRef } from 'react';
import { useCart } from './useCart';

const ABANDONED_CART_DELAY = 30 * 60 * 1000;

export function useAbandonedCartReminder() {
  const { items, getTotalPrice } = useCart();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailSentRef = useRef<boolean>(false);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    emailSentRef.current = false;

    if (items.length === 0) {
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      if (items.length === 0 || emailSentRef.current) {
        return;
      }

      console.log('Enviando lembrete de carrinho abandonado...');

      console.log('Lembrete de carrinho abandonado desativado nesta migração.');
      emailSentRef.current = true;
    }, ABANDONED_CART_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [items, getTotalPrice]);
}
