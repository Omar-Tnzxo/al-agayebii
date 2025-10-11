"use client";

import { Printer } from 'lucide-react';

export default function PrintButton() {
  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
    >
      <Printer className="h-4 w-4" />
      طباعة
    </button>
  );
} 