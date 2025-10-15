/**
 * تنسيق الأرقام بطريقة ذكية
 * - إذا كان الرقم صحيح (مثل 100) يظهر بدون أصفار عشرية
 * - إذا كان الرقم عشري (مثل 100.50) يظهر الجزء العشري
 * - الأرقام بالإنجليزية (1234 بدلاً من ١٢٣٤)
 */
export function formatCurrency(value: number): string {
  // التحقق من أن القيمة رقم صحيح
  if (Number.isInteger(value)) {
    return value.toLocaleString('en-US');
  }
  
  // إذا كان عشري، نعرض رقمين عشريين فقط
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * تنسيق السعر مع العملة
 */
export function formatPrice(value: number): string {
  return `${formatCurrency(value)} ج.م`;
}

/**
 * تنسيق النسبة المئوية
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
