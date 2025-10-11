"use client";

import { toast } from '@/components/ui/use-toast';

/**
 * عرض Toast لرسالة خطأ بشكل موحّد
 */
export function showErrorToast(message: string, type: 'error' | 'success' = 'error') {
  if (type === 'success') {
    toast({ description: message });
  } else {
    toast({ variant: 'destructive', description: message });
  }
} 