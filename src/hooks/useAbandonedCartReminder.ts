import { useEffect, useRef } from 'react';
import { useCart } from './useCart';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

const ABANDONED_CART_DELAY = 30 * 60 * 1000; // 30 minutes

export function useAbandonedCartReminder() {
  const { items, getTotalPrice } = useCart();
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailSentRef = useRef<boolean>(false);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset email sent flag when cart changes
    emailSentRef.current = false;

    // Only set reminder if cart has items and user has email
    const userEmail = user?.email;
    if (items.length === 0 || !userEmail) {
      return;
    }

    // Set timeout to send abandoned cart email
    timeoutRef.current = setTimeout(async () => {
      // Check if cart still has items
      if (items.length === 0 || emailSentRef.current) {
        return;
      }

      console.log('Sending abandoned cart reminder...');

      try {
        const { error } = await supabase.functions.invoke('send-abandoned-cart-email', {
          body: {
            customerEmail: userEmail,
            customerName: user?.user_metadata?.full_name || '',
            cartItems: items.map(item => ({
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              imageUrl: item.product.image_url,
            })),
            totalPrice: getTotalPrice(),
          },
        });

        if (error) {
          console.error('Failed to send abandoned cart email:', error);
        } else {
          console.log('Abandoned cart email sent!');
          emailSentRef.current = true;
        }
      } catch (err) {
        console.error('Error sending abandoned cart email:', err);
      }
    }, ABANDONED_CART_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [items, user, getTotalPrice]);
}
