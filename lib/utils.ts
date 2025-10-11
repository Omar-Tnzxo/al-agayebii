// Re-export all helper functions from utils/helpers.ts
export * from './utils/helpers';

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * دالة مساعدة لدمج الفصول بشكل صحيح مع Tailwind CSS
 * تسمح بدمج الفصول الشرطية والديناميكية
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 