'use client';

import { useEffect } from 'react';
import Script from 'next/script';

// مكون لتكامل Hotjar لتحليل سلوك المستخدم وإنشاء خرائط حرارية
export function Hotjar() {
  const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID || '0000000';
  const HOTJAR_VERSION = process.env.NEXT_PUBLIC_HOTJAR_VERSION || '6';

  // استخدام نهج Script بدلاً من المكتبة لتجنب مشاكل التوافق
  return (
    <>
      <Script
        id="hotjar-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${HOTJAR_ID},hjsv:${HOTJAR_VERSION}};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `,
        }}
      />
    </>
  );
} 