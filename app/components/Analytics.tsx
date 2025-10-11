'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export function Analytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // تكامل Google Analytics
  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      // دالة تهيئة Google Analytics
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
        transport_type: 'beacon',
        anonymize_ip: true,
      });

      // إرسال بيانات الصفحة عند تغير المسار
      const handleRouteChange = (url: string) => {
        gtag('config', GA_MEASUREMENT_ID, {
          page_path: url,
          transport_type: 'beacon',
        });
      };

      // إضافة مستمع لتغيير المسار
      window.addEventListener('popstate', () => handleRouteChange(window.location.pathname));

      // تنظيف المستمع عند إزالة المكون
      return () => {
        window.removeEventListener('popstate', () => handleRouteChange(window.location.pathname));
      };
    }
  }, [GA_MEASUREMENT_ID]);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* إضافة سكريبت Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
} 