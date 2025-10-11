'use client';

// React import غير مطلوب مع محول JSX الجديد
import Link from 'next/link';
import { useSiteSettings } from './SiteSettingsProvider';

interface SocialLinksProps {
  className?: string;
}

export function SocialLinks({ className = '' }: SocialLinksProps) {
  const { settings } = useSiteSettings();

  const socialLinks = {
    facebook: settings.facebookUrl || 'https://www.facebook.com/share/1AiDJAsxwR/',
    tiktok: settings.tiktokUrl || 'https://www.tiktok.com/@aleajaybi?_t=ZS-8wLvBv2zpah&_r=1',
    instagram: settings.instagramUrl || 'https://www.instagram.com/aleajaybi',
    // يمكن إضافة روابط أخرى هنا في المستقبل
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* رابط الفيسبوك */}
      <Link 
        href={socialLinks.facebook} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-accent hover:text-primary transition-colors"
        title="تابعنا على فيسبوك"
        aria-label="صفحة الفيسبوك الخاصة بمتجر العجايبي"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M22.675 0H1.325C0.593 0 0 0.593 0 1.325v21.351C0 23.407 0.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463 0.099 2.795 0.143v3.24l-1.918 0.001c-1.504 0-1.795 0.715-1.795 1.763v2.313h3.587l-0.467 3.622h-3.12V24h6.116c0.73 0 1.323-0.593 1.323-1.325V1.325C24 0.593 23.407 0 22.675 0z"/>
        </svg>
      </Link>
      
      {/* رابط التيكتوك */}
      <Link 
        href={socialLinks.tiktok} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-accent hover:text-primary transition-colors"
        title="تابعنا على تيكتوك"
        aria-label="حساب التيكتوك الخاص بمتجر العجايبي"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      </Link>
      
      {/* رابط انستجرام */}
      <Link
        href={socialLinks.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:text-primary transition-colors"
        title="تابعنا على انستجرام"
        aria-label="حساب انستجرام الخاص بمتجر العجايبي"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.49-.99a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z"/>
        </svg>
      </Link>
    </div>
  );
} 