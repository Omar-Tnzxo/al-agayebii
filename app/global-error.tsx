"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="container mx-auto flex flex-col items-center justify-center min-h-screen text-center px-4 gap-6">
          <AlertTriangle className="h-20 w-20 text-red-500" />
          <h1 className="text-4xl font-bold">عذراً، حدث خطأ غير متوقع</h1>
          <p className="text-gray-600 max-w-md">
            حدث خطأ أثناء معالجة طلبك. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              <RotateCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-blue-600 px-6 py-3 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
