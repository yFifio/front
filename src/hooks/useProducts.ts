import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Product } from '@/types';

interface ProductListResponse {
  data?: Product[];
}

export function useProducts(category?: 'digital' | 'physical') {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      const response = await apiRequest('/products') as ProductListResponse;
      
      let products = response.data || [];

      if (category) {
        products = products.filter((p) => p.category === category);
      }

      return products as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const product = await apiRequest(`/products/${id}`);
      
      return product as Product | null;
    },
    enabled: !!id,
  });
}
