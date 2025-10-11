"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export const metadata = {
  title: 'حدث خطأ غير متوقع',
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // سجّل الخطأ في console أو خدمة خارجية
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-6" dir="rtl">
      <AlertTriangle className="h-20 w-20 text-destructive" />
      <h1 className="text-4xl font-bold text-primary">عذراً، حدث خطأ غير متوقع</h1>
      <p className="text-accent/70 max-w-md">
        حدث خطأ أثناء معالجة طلبك. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90 transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-primary px-6 py-3 text-primary hover:bg-primary/5 transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
} 