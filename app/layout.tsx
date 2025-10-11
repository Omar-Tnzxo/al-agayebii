import '@/lib/utils/env';
import '@/lib/init-logger';
import './globals.css';
import { Tajawal, Cairo } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import { Analytics } from './components/Analytics';
import { Hotjar } from './components/Hotjar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import ClientRoot from '@/components/ClientRoot';
import { SiteSettingsProvider } from './components/SiteSettingsProvider';
import { getSiteSettings } from '@/lib/site-settings';
import { Suspense } from 'react';
import { PublicLayoutShell } from './components/PublicLayoutShell';
import { Toaster } from 'sonner';



// استيراد الخطوط العربية
const tajawal = Tajawal({
  subsets: ['arabic'],
  display: 'swap',
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
});

const cairo = Cairo({
  subsets: ['arabic'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-cairo',
});

// استيراد الخطوط الافتراضية

// إعدادات viewport منفصلة عن metadata
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  width: 'device-width',
  initialScale: 1,
};

// بيانات الوصف للموقع لتحسين SEO
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings.siteName || 'متجر العجايبي للأدوات والمعدات';
  const siteDescription = settings.siteDescription || 'المتجر الرسمي للعجايبي - أدوات منزلية ومعدات مهنية وكهربائية عالية الجودة';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alagayebi.com';

  return {
  title: {
      template: `%s | ${siteName}`,
      default: siteName,
  },
    description: siteDescription,
  keywords: 'العجايبي, أدوات منزلية, معدات, أجهزة كهربائية',
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
    metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
      title: siteName,
      description: siteDescription,
      url: baseUrl,
      siteName,
    locale: 'ar_EG',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
      title: siteName,
    card: 'summary_large_image',
  },
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};
}

// مكون عميل يتحقق من المسار ويعرض الهيدر والفوتر فقط خارج لوحة التحكم

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSettings = await getSiteSettings();

  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${cairo.variable}`} suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className={`font-tajawal antialiased bg-background min-h-screen flex flex-col`}>
        <Toaster richColors position="top-center" closeButton />
        <SiteSettingsProvider initialSettings={initialSettings}>
          <Suspense fallback={null}>
            <PublicLayoutShell>{children}</PublicLayoutShell>
          </Suspense>
        </SiteSettingsProvider>
      </body>
    </html>
  );
} 