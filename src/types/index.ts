export interface ProductImage {
  id: string;
  product_id: string | null;
  image_url: string;
  file_path: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  age_range: string | null;
  category: 'digital' | 'physical';
  categoryId?: number | null;
  book_category?: string | null;
  is_active: boolean;
  discount_percent: number | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customer_id: string | null;
  customer_email: string;
  customer_name: string | null;
  total_price: number;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price_at_purchase: number;
  quantity: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  mercado_pago_id: string | null;
  status: string;
  amount: number;
  payment_method: string | null;
  payer_email: string | null;
  raw_data: Record<string, string | number | boolean | null> | null;
  created_at: string;
  updated_at: string;
}

export interface Download {
  id: string;
  order_id: string;
  product_id: string;
  download_token: string;
  expires_at: string;
  download_count: number;
  max_downloads: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DigitalFile {
  id: string;
  product_id: string;
  file_path: string;
  file_name: string;
  created_at: string;
}
