import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// استيراد المكونات الجديدة
import HeroCarousel from './components/homepage/HeroCarousel';
import CategorySection from './components/homepage/CategoryGrid';
import DynamicProductSection from './components/homepage/DynamicProductSection';

// إعدادات محددة للصفحة الرئيسية (SEO)
export const metadata: Metadata = {
  title: 'الصفحة الرئيسية | متجر العجايبي للأدوات الكهربائية والصحية',
  description: 'استكشف تشكيلة واسعة من الأدوات الكهربائية والصحية عالية الجودة بأسعار تنافسية في متجر العجايبي.',
  openGraph: {
    title: 'متجر العجايبي للأدوات الكهربائية والصحية',
    description: 'استكشف تشكيلة واسعة من الأدوات الكهربائية والصحية عالية الجودة بأسعار تنافسية في متجر العجايبي.',
    type: 'website',
  },
};

// إعادة توليد الصفحة كل 10 دقائق (ISR)
export const revalidate = 600;

// واجهات البيانات (مبسط - صورة + رابط فقط)
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

// جلب بيانات Hero Carousel
async function fetchHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching hero slides:', error);
    return [];
  }
}

// جلب الفئات
async function fetchCategories(): Promise<Category[]> {
  try {
    // جلب الفئات مع عدد المنتجات
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, type, image')
      .eq('is_active', true)
      .limit(8);

    if (error) throw error;

    // جلب عدد المنتجات لكل فئة
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_type', cat.type)
          .eq('is_active', true);

        return {
          ...cat,
          productCount: count || 0
        };
      })
    );

    return categoriesWithCount;
  } catch (error) {
    logger.error('Error fetching categories:', error);
    return [];
  }
}

// جلب أقسام الصفحة الرئيسية
async function fetchHomepageSections(): Promise<HomepageSection[]> {
  try {
    const { data: sections, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // جلب المنتجات لكل قسم
    const sectionsWithProducts = await Promise.all(
      (sections || []).map(async (section) => {
        if (section.section_type !== 'products') {
          return section;
        }

        const settings = section.settings || {};
        let products: Product[] = [];

        // جلب المنتجات حسب المصدر
        if (settings.product_source === 'manual') {
          // جلب المنتجات المحددة يدوياً
          const { data: sectionProducts } = await supabase
            .from('homepage_section_products')
            .select(`
              sort_order,
              products:product_id (
                id, name, description, price, original_price,
                images, rating, reviews_count, in_stock, badge
              )
            `)
            .eq('section_id', section.id)
            .order('sort_order', { ascending: true });

          products = (sectionProducts || []).map((sp: any) => ({
            id: sp.products.id,
            name: sp.products.name,
            description: sp.products.description,
            price: sp.products.price,
            originalPrice: sp.products.original_price,
            images: sp.products.images || [],
            rating: sp.products.rating,
            reviewCount: sp.products.reviews_count,
            inStock: sp.products.in_stock,
            badge: sp.products.badge
          }));
        } else {
          // جلب المنتجات تلقائياً حسب النوع
          let query = supabase
            .from('products')
            .select('id, name, description, price, original_price, images, rating, reviews_count, in_stock, badge')
            .eq('is_active', true);

          if (settings.product_source === 'category' && settings.category_type) {
            query = query.eq('category_type', settings.category_type);
          } else if (settings.product_source === 'best_sellers') {
            query = query.order('sales_count', { ascending: false });
          } else if (settings.product_source === 'new') {
            query = query.order('created_at', { ascending: false });
          } else if (settings.product_source === 'deals') {
            query = query.not('original_price', 'is', null);
          }

          query = query.limit(settings.product_count || 8);

          const { data: productsData } = await query;

          products = (productsData || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            originalPrice: p.original_price,
            images: p.images || [],
            rating: p.rating,
            reviewCount: p.reviews_count,
            inStock: p.in_stock,
            badge: p.badge
          }));
        }

        return {
          ...section,
          products
        };
      })
    );

    return sectionsWithProducts;
  } catch (error) {
    logger.error('Error fetching homepage sections:', error);
    return [];
  }
}

// الصفحة الرئيسية الجديدة (نظام ديناميكي)
export default async function HomePage() {
  try {
    // جلب جميع البيانات بشكل متوازي
    const [heroSlides, categories, sections] = await Promise.all([
      fetchHeroSlides(),
      fetchCategories(),
      fetchHomepageSections()
    ]);

    logger.info('🏠 Homepage rendered successfully');

    return (
      <main dir="rtl" className="bg-white">
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

        {/* Dynamic Product Sections - الأقسام الديناميكية */}
        {sections.map((section) => {
          if (section.section_type === 'products' && section.products && section.products.length > 0) {
            // تحديد رابط "عرض الكل" حسب نوع القسم
            let viewAllLink = '/products';
            const settings = section.settings || {};

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
        {sections.filter(s => s.section_type === 'products').length === 0 && (
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-gray-500 text-lg">لا توجد أقسام معروضة حالياً</p>
            <p className="text-gray-400 text-sm mt-2">يمكنك إضافة أقسام من لوحة التحكم</p>
          </div>
        )}
      </main>
    );
  } catch (error) {
    logger.error('Error rendering HomePage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">حدث خطأ أثناء تحميل الصفحة</h1>
          <p className="text-gray-600 mb-6">نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى لاحقاً</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            تحديث الصفحة
          </a>
        </div>
      </div>
    );
  }
} 