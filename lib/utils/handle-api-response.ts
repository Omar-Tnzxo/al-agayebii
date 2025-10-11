"use client";

import { showErrorToast } from '@/lib/utils/show-error-toast';

interface ApiBaseResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  code?: string;
}

interface ApiResult<T> {
  data?: T;
  error?: string;
}

/**
 * غلاف موحّد لاستدعاءات fetch في الواجهة
 * @example
 * const {data, error} = await handleApiResponse<Product[]>(fetch('/api/products'))
 */
export async function handleApiResponse<T>(promise: Promise<Response>): Promise<ApiResult<T>> {
  try {
    const response = await promise;
    const json: ApiBaseResponse<T> = await response.json();

    if (response.ok && json && json.success !== false) {
      return { data: (json.data ?? (json as unknown as T)) };
    }

    const errorMessage = json?.error || 'حدث خطأ غير متوقع';
    // إظهار Toast افتراضي إذا لم تتم معالجته
    showErrorToast(errorMessage);
    return { error: errorMessage };
  } catch (err) {
    console.error('handleApiResponse error:', err);
    const fallback = 'تعذر الاتصال بالخادم، حاول مرة أخرى';
    showErrorToast(fallback);
    return { error: fallback };
  }
} 