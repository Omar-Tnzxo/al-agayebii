// Database Types
export interface Category {
  id: string;
  name: string;
  type: 'electrical' | 'plumbing' | 'tools' | 'other';
  description?: string;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category_type: string;
  stock_quantity: number;
  is_active: boolean;
  is_popular: boolean;
  is_new: boolean;
  discount_percentage: number;
  slug: string;
  sku: string;
  is_featured?: boolean;
  category_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  categories?: Category;
  category?: Category;
  // Additional product relations
  images?: ProductImage[];
  colors?: ProductColor[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductColor {
  id: string;
  product_id: string;
  color_name: string;
  color_code: string; // HEX color code
  is_available: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: string; // 'color', 'size', 'material', etc.
  variant_name: string;
  variant_value: string;
  additional_price: number;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  governorate?: string;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'canceled';
  payment_method: string;
  total: number;
  shipping_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  // tracking_number تم إزالته نهائياً
  shipping_company?: string;
  estimated_delivery?: string;
  actual_delivery_date?: string;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  completed_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  quantity: number;
  price: number;
  total_price?: number;
  created_at: string;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// UI Component Types
export interface CategoryCardProps {
  category: Category;
}

export interface ProductCardProps {
  product: Product;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Form Types
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category_type: string;
  stock_quantity: number;
  is_active: boolean;
  is_popular: boolean;
  is_new: boolean;
  discount_percentage: number;
  image?: string;
}

export interface OrderFormData {
  customer_name: string;
  customer_phone: string;
  address: string;
  governorate?: string;
  payment_method: string;
  customer_notes?: string;
  items: OrderItemFormData[];
}

export interface OrderItemFormData {
  product_id: string;
  quantity: number;
  price: number;
}

// Auth Types
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Shipping Types (Simplified)
export interface ShippingCompany {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  base_shipping_cost: number;
  free_shipping_threshold: number;
  is_default: boolean;
  is_active: boolean;
  delivery_time_min: number;
  delivery_time_max: number;
  contact_phone?: string;
  contact_email?: string;
  website_url?: string;
  terms_conditions?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingCalculation {
  shipping_company_id: string;
  shipping_company_name: string;
  original_shipping_cost: number;
  final_shipping_cost: number;
  is_free_shipping: boolean;
  free_shipping_threshold: number;
  savings: number;
  is_default?: boolean;
}

export interface ShippingSettings {
  shipping_companies_enabled: boolean;
  default_shipping_cost: number;
  default_free_shipping_threshold: number;
}

// Utility Types
export type UserRole = 'admin' | 'super_admin' | 'manager';

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete';
  roles: UserRole[];
}

 