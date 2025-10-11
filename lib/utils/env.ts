// Environment setup for Supabase compatibility

// Fix for 'self is not defined' error in Node.js environment
if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  Object.defineProperty(globalThis, 'self', {
    value: globalThis,
    writable: true,
    configurable: true
  });
}

if (typeof global !== 'undefined' && typeof (global as any).self === 'undefined') {
  Object.defineProperty(global, 'self', {
    value: global,
    writable: true,
    configurable: true
  });
}

export default {}; 