import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'تواصل معنا | متجر العجايبي للأدوات الكهربائية والصحية',
  description: 'تواصل مع متجر العجايبي - أرقام الهاتف، العنوان، ساعات العمل، وجميع طرق التواصل. نحن هنا لخدمتك في 6 أكتوبر، الجيزة',
  keywords: [
    'تواصل معنا',
    'متجر العجايبي',
    'اتصل بنا',
    'خدمة العملاء',
    'الدعم',
    'مساعدة',
    '6 أكتوبر',
    'الجيزة',
    'أدوات كهربائية',
    'معدات صحية',
    'رقم هاتف',
    'عنوان',
    'ساعات العمل'
  ],
  openGraph: {
    title: 'تواصل معنا | متجر العجايبي',
    description: 'تواصل مع متجر العجايبي للأدوات الكهربائية والصحية. نحن هنا لخدمتك',
    type: 'website',
    locale: 'ar_EG',
  },
  twitter: {
    card: 'summary',
    title: 'تواصل معنا | متجر العجايبي',
    description: 'تواصل مع متجر العجايبي للأدوات الكهربائية والصحية',
  },
  alternates: {
    canonical: '/contact',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};