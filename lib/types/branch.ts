/**
 * نوع بيانات الفرع للاستلام المباشر
 */
export interface Branch {
  id: string;
  name: string;
  address: string;
  governorate: string;
  city?: string;
  phone: string;
  email?: string;
  working_hours?: string;
  google_maps_url?: string;
  map_embed_url?: string;
  image_url?: string;
  latitude?: string;
  longitude?: string;
  notes?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * نوع بيانات إنشاء فرع جديد
 */
export interface CreateBranchInput {
  name: string;
  address: string;
  governorate: string;
  city?: string;
  phone: string;
  email?: string;
  working_hours?: string;
  google_maps_url?: string;
  map_embed_url?: string;
  image_url?: string;
  latitude?: string;
  longitude?: string;
  notes?: string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * نوع بيانات تحديث فرع
 */
export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  id: string;
}

/**
 * استجابة API للفروع
 */
export interface BranchesResponse {
  success: boolean;
  data?: Branch[];
  error?: string;
}

/**
 * استجابة API لفرع واحد
 */
export interface BranchResponse {
  success: boolean;
  data?: Branch;
  error?: string;
}
