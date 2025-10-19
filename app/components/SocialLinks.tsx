'use client';

import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageSquare,
  Send,
  Music,
  Share2
} from 'lucide-react';
import { useSiteSettings } from './SiteSettingsProvider';

interface SocialLinksProps {
  className?: string;
}

// أيقونة TikTok مخصصة
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// تكوين أيقونات السوشيال ميديا
const socialConfig = [
  { key: 'contact_facebook_url', icon: Facebook, label: 'فيسبوك' },
  { key: 'contact_instagram_url', icon: Instagram, label: 'إنستغرام' },
  { key: 'contact_twitter_url', icon: Twitter, label: 'تويتر' },
  { key: 'contact_linkedin_url', icon: Linkedin, label: 'لينكد إن' },
  { key: 'contact_youtube_url', icon: Youtube, label: 'يوتيوب' },
  { key: 'contact_tiktok_url', icon: TikTokIcon, label: 'تيك توك' },
  { key: 'contact_telegram_url', icon: Send, label: 'تيليجرام' },
  { key: 'contact_snapchat_url', icon: MessageSquare, label: 'سناب شات' },
  { key: 'contact_pinterest_url', icon: Share2, label: 'بينترست' },
  { key: 'contact_whatsapp_business_url', icon: MessageSquare, label: 'واتساب بزنس' },
];

export function SocialLinks({ className = '' }: SocialLinksProps) {
  const { settings } = useSiteSettings();

  // تصفية الروابط النشطة فقط (التي لها قيم)
  const activeLinks = socialConfig.filter(config => settings[config.key]);

  // إذا لم توجد روابط نشطة، لا نعرض شيء
  if (activeLinks.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {activeLinks.map((config) => {
        const Icon = config.icon;
        return (
          <Link
            key={config.key}
            href={settings[config.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
            title={`تابعنا على ${config.label}`}
            aria-label={`${config.label}`}
          >
            <Icon className="w-4 h-4" />
          </Link>
        );
      })}
    </div>
  );
} 