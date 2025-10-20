export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost_price?: number;
  image: string;
  category_type: string;
  category?: string;
  stock?: number;
  slug: string;
  sku: string;
  is_featured?: boolean;
  is_exclusive?: boolean;
  category_id?: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_popular?: boolean;
  is_new?: boolean;
  discount_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method?: string;
  createdAt: string;
  updatedAt: string;
}

// Database Order type for admin dashboard
export interface DatabaseOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  payment_method: string;
  total: number;
  items_count: number;
  status: string;
  created_at: string;
  updated_at: string | null;
  // Additional computed fields for dashboard
  order_number?: string;
  governorate?: string;
  payment_status?: string;
  shipping_cost?: number;
  total_cost?: number;
  total_profit?: number;
}


export interface ApiError {
  error: string;
}

export interface AdminSession {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin';
  type?: 'access' | 'refresh';
}