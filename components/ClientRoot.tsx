"use client";

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

export default function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary>
      {children}
      <Toaster />
    </GlobalErrorBoundary>
  );
} 