import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// استيراد المكونات الجديدة
import RealtimeHomepage from './components/homepage/RealtimeHomepage';

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

// إعادة توليد الصفحة كل دقيقة (ISR)
export const revalidate = 60;

// تفعيل Dynamic Rendering للصفحة الرئيسية
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

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
          const { data: sectionProducts, error: sectionError } = await supabase
            .from('homepage_section_products')
            .select(`
              sort_order,
              product_id (
                id, name, description, price, discount_percentage, slug,
                image, rating, reviews_count, stock_quantity, is_active
              )
            `)
            .eq('section_id', section.id)
            .order('sort_order', { ascending: true });

          if (sectionError) {
            logger.error('Error fetching manual section products:', sectionError);
          }

          products = (sectionProducts || [])
            .filter((sp: any) => sp.product_id && sp.product_id.is_active)
            .map((sp: any) => {
              const p = sp.product_id;
              const originalPrice = p.discount_percentage > 0 
                ? p.price / (1 - p.discount_percentage / 100)
                : undefined;
              
              return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                description: p.description,
                price: p.price,
                originalPrice: originalPrice,
                images: p.image ? [p.image] : [],
                rating: p.rating,
                reviewCount: p.reviews_count,
                inStock: p.stock_quantity > 0,
                badge: p.discount_percentage > 0 ? `خصم ${Math.round(p.discount_percentage)}%` : undefined
              };
            });
        } else {
          // جلب المنتجات تلقائياً حسب النوع
          let query = supabase
            .from('products')
            .select('id, name, description, price, discount_percentage, slug, image, rating, reviews_count, stock_quantity, created_at')
            .eq('is_active', true);

          if (settings.product_source === 'category' && settings.category_type) {
            query = query.eq('category_type', settings.category_type);
          } else if (settings.product_source === 'best_sellers') {
            // ترتيب حسب view_count إذا لم يكن هناك sales_count
            query = query.order('view_count', { ascending: false });
          } else if (settings.product_source === 'new') {
            query = query.order('created_at', { ascending: false });
          } else if (settings.product_source === 'deals') {
            query = query.gt('discount_percentage', 0);
          }

          query = query.limit(settings.product_count || 8);

          const { data: productsData, error: productsError } = await query;

          if (productsError) {
            logger.error('Error fetching auto section products:', productsError);
          }

          products = (productsData || []).map((p: any) => {
            const originalPrice = p.discount_percentage > 0 
              ? p.price / (1 - p.discount_percentage / 100)
              : undefined;
            
            return {
              id: p.id,
              slug: p.slug,
              name: p.name,
              description: p.description,
              price: p.price,
              originalPrice: originalPrice,
              images: p.image ? [p.image] : [],
              rating: p.rating,
              reviewCount: p.reviews_count,
              inStock: p.stock_quantity > 0,
              badge: p.discount_percentage > 0 ? `خصم ${Math.round(p.discount_percentage)}%` : undefined
            };
          });
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
      <RealtimeHomepage 
        initialHeroSlides={heroSlides}
        initialCategories={categories}
        initialSections={sections}
      />
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