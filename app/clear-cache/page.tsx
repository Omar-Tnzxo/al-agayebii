'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw } from 'lucide-react';

export default function ClearCachePage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Clear all shipping-related cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('alagayebi_shipping_settings');
      localStorage.removeItem('alagayebi_shipping_cache_expiry');
      localStorage.removeItem('alagayebi_shipping_system_settings');

      setCleared(true);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {cleared ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              تم مسح الكاش بنجاح!
            </h1>
            <p className="text-gray-600 mb-4">
              سيتم إعادة توجيهك إلى الصفحة الرئيسية...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              جاري مسح الكاش...
            </h1>
          </>
        )}
      </div>
    </div>
  );
}
