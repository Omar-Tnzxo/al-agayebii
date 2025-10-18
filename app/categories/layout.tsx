import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'التصنيفات | متجر العجايبي',
  description: 'تصفح تصنيفات منتجات متجر العجايبي للأدوات الكهربائية والصحية',
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
