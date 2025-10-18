"use client";

import { AlertTriangle, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export const metadata = {
  title: 'خطأ في لوحة التحكم',
};

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-6" dir="rtl">
      <AlertTriangle className="h-20 w-20 text-destructive" />
      <h1 className="text-3xl font-bold text-primary">حدث خطأ في لوحة التحكم</h1>
      <p className="text-gray-600 max-w-md">جرّب إعادة تحميل الصفحة أو تواصل مع المطوّر إن استمر الخطأ.</p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90 transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg border border-primary px-6 py-3 text-primary hover:bg-primary/5 transition-colors"
        >
          لوحة التحكم
        </Link>
      </div>
    </main>
  );
} 