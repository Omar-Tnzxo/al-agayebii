import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'جميع المنتجات | متجر العجايبي',
  description: 'تسوق مجموعة واسعة من الأدوات الكهربائية والصحية والأدوات اليدوية',
};

// تفعيل ISR لصفحة قائمة المنتجات (10 دقائق)
export const revalidate = 600; 