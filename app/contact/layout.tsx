import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'اتصل بنا | متجر العجايبي',
  description: 'تواصل مع متجر العجايبي للأدوات الكهربائية والصحية في مدينة 6 أكتوبر، محافظة الجيزة، مصر',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 