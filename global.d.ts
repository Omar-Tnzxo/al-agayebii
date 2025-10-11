// Global types and polyfills
declare global {
  // إضافة polyfill للـ self في Server-side
  var self: typeof globalThis;
}

export {}; 