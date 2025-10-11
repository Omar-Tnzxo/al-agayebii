import { supabase } from '../supabase';

// تعريف أنواع البيانات
export interface Category {
  id: string;
  name: string;
  type: 'electrical' | 'plumbing' | 'tools' | 'other';
  description?: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_type: string;
  image: string;
  stockQuantity: number;
  isPopular?: boolean;
  isNew?: boolean;
  discount?: number;
  rating?: number;
  slug: string;
  sku: string;
}

// بيانات ثابتة للتصنيفات (للاستخدام أثناء البناء والحالات الطارئة)
const staticCategories: Category[] = [
  {
    id: '1',
    name: 'أدوات كهربائية',
    type: 'electrical',
    description: 'أدوات ومعدات كهربائية عالية الجودة',
    image: '/images/electrical.png'
  },
  {
    id: '2',
    name: 'أدوات صحية',
    type: 'plumbing',
    description: 'أدوات ومعدات صحية متخصصة',
    image: '/images/plumbing.jpg'
  },
  {
    id: '3',
    name: 'أدوات يدوية',
    type: 'tools',
    description: 'أدوات يدوية متنوعة وعملية',
    image: '/images/tools.jpg'
  },
  {
    id: '4',
    name: 'معدات السلامة',
    type: 'other',
    description: 'معدات وأدوات السلامة المهنية',
    image: '/images/safety.jpg'
  }
];

// بيانات ثابتة للمنتجات (للاستخدام أثناء البناء والحالات الطارئة)
const staticProducts: Product[] = [
  {
    id: '1',
    name: 'مثقاب كهربائي احترافي',
    description: 'مثقاب كهربائي عالي الجودة مع بطارية قابلة للشحن، مناسب لجميع أعمال الحفر والبناء',
    price: 299.99,
    category_type: 'electrical',
    image: '/images/drill.jpg',
    stockQuantity: 15,
    isPopular: true,
    isNew: false,
    discount: 10,
    rating: 4.5,
    slug: 'electric-drill-professional',
    sku: 'EDP-001',
  },
  {
    id: '2',
    name: 'طقم مفاتيح شامل',
    description: 'طقم مفاتيح متكامل يحتوي على جميع المقاسات المطلوبة لأعمال الصيانة',
    price: 149.99,
    category_type: 'tools',
    image: '/images/wrench-set.jpg',
    stockQuantity: 20,
    isPopular: false,
    isNew: true,
    discount: 0,
    rating: 4.2,
    slug: 'wrench-set-complete',
    sku: 'WSC-002',
  },
  {
    id: '3',
    name: 'مفك براغي كهربائي',
    description: 'مفك براغي كهربائي قابل لإعادة الشحن مع عدة رؤوس مختلفة',
    price: 89.99,
    category_type: 'electrical',
    image: '/images/products/product-1.jpg',
    stockQuantity: 12,
    isPopular: true,
    isNew: true,
    discount: 5,
    rating: 4.7,
    slug: 'electric-screwdriver',
    sku: 'ESD-003',
  },
  {
    id: '4',
    name: 'خلاط مياه حديث',
    description: 'خلاط مياه عصري وعملي للمطابخ والحمامات',
    price: 199.99,
    category_type: 'plumbing',
    image: '/images/faucet.png',
    stockQuantity: 8,
    isPopular: true,
    isNew: false,
    discount: 15,
    rating: 4.3,
    slug: 'modern-water-mixer',
    sku: 'MWM-004',
  },
  {
    id: '5',
    name: 'مطرقة احترافية',
    description: 'مطرقة قوية ومتينة مناسبة لجميع أعمال البناء',
    price: 49.99,
    category_type: 'tools',
    image: '/images/hammer.png',
    stockQuantity: 25,
    isPopular: false,
    isNew: false,
    discount: 0,
    rating: 4.0,
    slug: 'professional-hammer',
    sku: 'PH-005',
  }
];

// متغيرات لتخزين البيانات المؤقتة
let cachedCategories: Category[] = [];
let cachedProducts: Product[] = [];
let lastCategoriesFetch = 0;
let lastProductsFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

// دالة للتحقق من البيئة (هل نحن في عملية البناء أم لا)
function isBuildTime(): boolean {
  return typeof window === 'undefined' && !global.fetch;
}

// استرجاع التصنيفات مع دعم البناء
export async function fetchCategories(): Promise<Category[]> {
  // في حالة البناء، استخدم البيانات الثابتة
  if (isBuildTime()) {
    return staticCategories;
  }

  // إذا كانت البيانات محملة مسبقًا والتحديث لم يتجاوز المدة المحددة
  const now = Date.now();
  if (cachedCategories.length > 0 && (now - lastCategoriesFetch) < CACHE_DURATION) {
    return cachedCategories;
  }

  try {
    // محاولة جلب البيانات من قاعدة البيانات مباشرة
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('خطأ Supabase في جلب التصنيفات:', error);
      throw new Error(error.message);
    }
    
    if (data && data.length > 0) {
    // تحويل البيانات إلى الشكل المطلوب
    const mappedCategories = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type || 'other',
      description: item.description || '',
      image: item.image || ''
    }));

    // تخزين البيانات وتحديث وقت آخر استدعاء
    cachedCategories = mappedCategories;
    lastCategoriesFetch = now;
    return cachedCategories;
    }
  } catch (error) {
    console.error('خطأ في جلب التصنيفات:', error);
  }
  
  // في حالة الفشل، استخدم البيانات الثابتة
  return staticCategories;
}

// استرجاع المنتجات مع دعم البناء
export async function fetchProducts(categoryType?: string): Promise<Product[]> {
  // في حالة البناء، استخدم البيانات الثابتة
  if (isBuildTime()) {
    return categoryType 
      ? staticProducts.filter(p => p.category_type === categoryType)
      : staticProducts;
  }

  // إذا كانت البيانات محملة مسبقًا والتحديث لم يتجاوز المدة المحددة
  const now = Date.now();
  if (cachedProducts.length > 0 && (now - lastProductsFetch) < CACHE_DURATION) {
    return categoryType 
      ? cachedProducts.filter(p => p.category_type === categoryType)
      : cachedProducts;
  }

  try {
    // بناء الاستعلام
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    // تصفية حسب التصنيف إذا طُلب ذلك
    if (categoryType) {
      query = query.eq('category_type', categoryType);
    }
    
    const { data, error } = await query.order('name');

    if (error) {
      console.error('خطأ Supabase في جلب المنتجات:', error);
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      // تحويل البيانات من قاعدة البيانات إلى شكل المنتجات المطلوب
    const mappedProducts = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category_type: item.category_type,
        image: item.image || '/images/product-default.png',
      stockQuantity: item.stock_quantity || 0,
      isPopular: item.is_popular || false,
      isNew: item.is_new || false,
        discount: item.discount_percentage || 0,
      rating: item.rating || 0,
      slug: item.slug || `product-${item.id}`,
      sku: item.sku || `SKU-${item.id}`,
    }));

      // تخزين البيانات وتحديث وقت آخر استدعاء (إذا لم نصفي حسب التصنيف)
      if (!categoryType) {
    cachedProducts = mappedProducts;
    lastProductsFetch = now;
      }
      
      return mappedProducts;
    }
  } catch (error) {
    console.error('خطأ في جلب المنتجات:', error);
  }
  
  // في حالة الفشل، استخدم البيانات الثابتة
  return categoryType 
    ? staticProducts.filter(p => p.category_type === categoryType)
    : staticProducts;
}

// تصدير البيانات الثابتة للاستخدام المباشر
export const categories = staticCategories;
export const products = staticProducts;

// دوال إضافية للسهولة
export const getProductById = (id: string): Product | undefined => {
  return staticProducts.find(p => p.id === id);
};

export const getCategoryById = (id: string): Category | undefined => {
  return staticCategories.find(c => c.id === id);
};

export const getCategoryByType = (type: string): Category | undefined => {
  return staticCategories.find(category => category.type === type);
};

export const getProductsByCategoryType = (categoryType: string): Product[] => {
  return staticProducts.filter(product => product.category_type === categoryType);
};

export const getPopularProducts = (): Product[] => {
  return staticProducts.filter(p => p.isPopular);
};

export const getNewProducts = (): Product[] => {
  return staticProducts.filter(p => p.isNew);
};