import Link from 'next/link';
import { Frown } from 'lucide-react';

export const metadata = {
  title: 'الصفحة غير موجودة',
};

export default function NotFound() {
  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-6" dir="rtl">
      <Frown className="h-20 w-20 text-destructive" />
      <h1 className="text-4xl font-bold text-primary">عذراً، الصفحة غير موجودة</h1>
      <p className="text-gray-600 max-w-md">
        الصفحة التي تحاول الوصول إليها غير متاحة حالياً أو ربما تم نقلها.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90 transition-colors"
      >
        العودة إلى الصفحة الرئيسية
      </Link>
    </main>
  );
} 