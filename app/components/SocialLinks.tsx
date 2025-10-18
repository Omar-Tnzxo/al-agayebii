'use client';

import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageSquare,
  Send
} from 'lucide-react';
import { useSiteSettings } from './SiteSettingsProvider';

interface SocialLinksProps {
  className?: string;
}

// تكوين أيقونات السوشيال ميديا
const socialConfig = [
  { key: 'contact_facebook_url', icon: Facebook, label: 'فيسبوك' },
  { key: 'contact_instagram_url', icon: Instagram, label: 'إنستغرام' },
  { key: 'contact_twitter_url', icon: Twitter, label: 'تويتر' },
  { key: 'contact_linkedin_url', icon: Linkedin, label: 'لينكد إن' },
  { key: 'contact_youtube_url', icon: Youtube, label: 'يوتيوب' },
  { key: 'contact_tiktok_url', icon: Send, label: 'تيك توك' },
  { key: 'contact_telegram_url', icon: Send, label: 'تيليجرام' },
  { key: 'contact_snapchat_url', icon: MessageSquare, label: 'سناب شات' },
  { key: 'contact_pinterest_url', icon: Send, label: 'بينترست' },
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