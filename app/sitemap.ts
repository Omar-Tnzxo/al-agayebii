import { MetadataRoute } from 'next';
import { categories, products } from '@/lib/data/mockData';

// إنشاء خريطة الموقع ديناميكيًا
export default function sitemap(): MetadataRoute.Sitemap {
  // تحديد عنوان URL الأساسي للموقع
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alagayebi.com';
  
  // إنشاء مسارات الصفحات الثابتة
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ] as MetadataRoute.Sitemap;
  
  // إنشاء مسارات صفحات التصنيفات
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/category/${category.type}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  })) as MetadataRoute.Sitemap;
  
  // إنشاء مسارات صفحات المنتجات
  const productPages = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  })) as MetadataRoute.Sitemap;
  
  // دمج جميع المسارات في خريطة موقع واحدة
  return [...staticPages, ...categoryPages, ...productPages];
} 