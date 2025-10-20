'use client';

import { useState } from 'react';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
import HeroCarousel from './HeroCarousel';
import CategorySection from './CategoryGrid';
import DynamicProductSection from './DynamicProductSection';

interface HeroSlide {
  id: string;
  image_url: string;
  link_url?: string;
  duration?: number;
}

interface Category {
  id: string;
  name: string;
  type: 'electrical' | 'plumbing' | 'tools' | 'other';
  image?: string;
  productCount?: number;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  badge?: string;
}

interface HomepageSection {
  id: string;
  section_type: 'hero_carousel' | 'categories' | 'products';
  title: string;
  subtitle?: string;
  sort_order: number;
  settings: any;
  products?: Product[];
}

interface RealtimeHomepageProps {
  initialHeroSlides: HeroSlide[];
  initialCategories: Category[];
  initialSections: HomepageSection[];
}

export default function RealtimeHomepage({
  initialHeroSlides,
  initialCategories,
  initialSections
}: RealtimeHomepageProps) {
  const [heroSlides, setHeroSlides] = useState(initialHeroSlides);
  const [categories, setCategories] = useState(initialCategories);
  const [sections, setSections] = useState(initialSections);
  const [isLoading, setIsLoading] = useState(false);

  // استماع للتغييرات في hero_slides
  useSupabaseRealtime({
    table: 'hero_slides',
    onChange: async () => {
      try {
        const response = await fetch('/api/homepage/hero-slides?active=true');
        const data = await response.json();
        if (data.success) {
          setHeroSlides(data.data || []);
        }
      } catch (error) {
        console.error('Error refreshing hero slides:', error);
      }
    }
  });

  // استماع للتغييرات في categories
  useSupabaseRealtime({
    table: 'categories',
    onChange: async () => {
      try {
        const response = await fetch('/api/categories?status=active');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Error refreshing categories:', error);
      }
    }
  });

  // استماع للتغييرات في products
  useSupabaseRealtime({
    table: 'products',
    onChange: async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/homepage/sections?active=true');
        const data = await response.json();
        if (data.success) {
          const sectionsWithProducts = await Promise.all(
            (data.data || []).map(async (section: HomepageSection) => {
              if (section.section_type === 'products') {
                const settings = section.settings || {};
                try {
                  let url = '/api/products?status=active';
                  
                  if (settings.product_source === 'category' && settings.category_type) {
                    url += `&category=${settings.category_type}`;
                  } else if (settings.product_source === 'best_sellers') {
                    url += '&sort=popular';
                  } else if (settings.product_source === 'new') {
                    url += '&sort=newest';
                  } else if (settings.product_source === 'deals') {
                    url += '&discount=true';
                  }
                  
                  url += `&limit=${settings.product_count || 8}`;
                  
                  const productsRes = await fetch(url);
                  const productsData = await productsRes.json();
                  
                  if (productsData.success) {
                    return {
                      ...section,
                      products: productsData.data.map((p: any) => ({
                        id: p.id,
                        slug: p.slug,
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        originalPrice: p.discount_percentage > 0 ? p.price / (1 - p.discount_percentage / 100) : undefined,
                        images: p.image ? [p.image] : [],
                        rating: p.rating,
                        reviewCount: p.reviews_count,
                        inStock: p.stock_quantity > 0,
                        badge: p.discount_percentage > 0 ? `خصم ${Math.round(p.discount_percentage)}%` : undefined
                      }))
                    };
                  }
                } catch (error) {
                  console.error('Error fetching products for section:', error);
                }
              }
              return section;
            })
          );
          
          setSections(sectionsWithProducts);
        }
      } catch (error) {
        console.error('Error refreshing sections:', error);
      } finally {
        setIsLoading(false);
      }
    }
  });

  return (
    <main dir="rtl" className="bg-white min-h-screen">
      {/* Hero Carousel - البنر الدوار */}
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      {/* Category Section - الفئات الرئيسية */}
      {categories.length > 0 && (
        <CategorySection
          categories={categories}
          title="تسوق حسب الفئة"
          subtitle="اختر الفئة المناسبة لاحتياجاتك"
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-4">جاري تحميل المنتجات...</p>
        </div>
      )}

      {/* Dynamic Product Sections - الأقسام الديناميكية */}
      {!isLoading && sections.map((section) => {
        if (section.section_type === 'products' && section.products && section.products.length > 0) {
          const settings = section.settings || {};
          let viewAllLink = '/products';

          if (settings.product_source === 'category' && settings.category_type) {
            viewAllLink = `/category/${settings.category_type}`;
          } else if (settings.product_source === 'best_sellers') {
            viewAllLink = '/products?filter=best_sellers';
          } else if (settings.product_source === 'new') {
            viewAllLink = '/products?filter=new';
          } else if (settings.product_source === 'deals') {
            viewAllLink = '/products?filter=deals';
          }

          return (
            <DynamicProductSection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              subtitle={section.subtitle}
              settings={settings}
              products={section.products}
              viewAllLink={viewAllLink}
            />
          );
        }
        return null;
      })}

      {/* رسالة افتراضية في حال عدم وجود أقسام */}
      {!isLoading && sections.filter(s => s.section_type === 'products').length === 0 && (
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-lg">لا توجد أقسام معروضة حالياً</p>
          <p className="text-gray-400 text-sm mt-2">يمكنك إضافة أقسام من لوحة التحكم</p>
        </div>
      )}
    </main>
  );
}
