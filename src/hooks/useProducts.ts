import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductImage } from '@/types';

export function useProducts(category?: 'digital' | 'physical') {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            product_id,
            image_url,
            file_path,
            is_primary,
            display_order,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Map product_images to images field and sort by display_order
      return (data || []).map((product: any) => ({
        ...product,
        images: (product.product_images || []).sort(
          (a: ProductImage, b: ProductImage) => a.display_order - b.display_order
        ),
      })) as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}
