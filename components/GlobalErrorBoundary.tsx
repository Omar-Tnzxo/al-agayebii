"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { showErrorToast } from '@/lib/utils/show-error-toast';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary عام للعميل – يلتقط أية أخطاء غير متوقعة في شجرة React
 * ويعرض Toast بالإضافة لواجهة احتياطية بسيطة.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalErrorBoundary caught:', error, errorInfo);
    showErrorToast('حدث خطأ غير متوقع، يرجى تحديث الصفحة');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center" dir="rtl">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold text-primary">حدث خطأ غير متوقع</h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary; 