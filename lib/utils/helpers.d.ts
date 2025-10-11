// ملف تعريف أنواع بيانات وهمي للوحدة المفقودة
declare module '@/lib/utils/helpers' {
  // تعريف الوظائف المفترضة التي كانت موجودة في الملف الأصلي
  export function formatPrice(price: number): string;
  export function formatDate(date: string | Date): string;
  export function calculateDiscountedPrice(price: number, discountPercentage: number): number;
  export function truncateText(text: string, length: number): string;
  export function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void;
  export function getImageUrl(path: string): string;
  export function generateSearchParams(params: Record<string, any>): URLSearchParams;
  export function parseSearchParams(searchParams: URLSearchParams): Record<string, string>;
  export function isAdmin(): Promise<boolean>;
  export function generateId(): string;
  export function formatOrderId(id: string | number): string;
  export function formatProductId(id: string | number): string;
  export function createWhatsAppLink(phoneNumber: string, message: string): string;
  export function formatOrderStatus(status: string): string;
  export function fetchGovernorates(shippingCompanyId?: string): Promise<any[]>;
} 