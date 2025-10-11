export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// نوع قاعدة البيانات المبسط بدون اعتماد على المصادقة
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          type: string
          image: string | null
          description: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          cost_price: number | null
          image: string
          category_type: string
          stock_quantity: number
          is_active: boolean
          is_popular: boolean
          is_new: boolean
          discount_percentage: number | null
          rating: number | null
          reviews_count: number | null
          created_at: string
          updated_at: string
          is_featured: boolean
          is_exclusive: boolean
          sku: string
          slug: string
        }
      }
      ratings: {
        Row: {
          id: string
          product_id: string
          rating: number
          comment: string | null
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string
          customer_email: string
          address: string
          payment_method: string
          total: number
          items_count: number
          status: string
          created_at: string
          updated_at: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrease_product_stock: {
        Args: {
          p_id: string
          amount: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 