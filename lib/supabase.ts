import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// احصل على متغيرات البيئة من ملف .env.local أو استخدم القيم الافتراضية الصحيحة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// تحقق من توفر متغيرات البيئة المطلوبة (فقط في development)
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.error('متغيرات البيئة الخاصة بـ Supabase غير متوفرة');
  }
}

// فقط في وضع التطوير
if (process.env.NODE_ENV === 'development') {
  import('./utils/logger').then(({ logger }) => {
    logger.info('🔧 إعدادات Supabase:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
  });
}

// Singleton Pattern - نسخة واحدة فقط من Supabase Client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

/**
 * إنشاء عميل Supabase للاستخدام في المستعرض
 * مع تكوين إضافي للاستعادة التلقائية
 * Singleton Pattern لتجنب Multiple Instances
 */
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      supabaseUrl, 
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
        global: {
          fetch: fetch.bind(globalThis),
          headers: { 'x-application-name': 'al-agayebi-store' },
        },
      }
    );
  }
  return supabaseInstance;
})();

/**
 * فحص اتصال Supabase والتحقق من صحته
 * يمكن استخدام هذه الوظيفة للتحقق من الاتصال قبل إجراء العمليات
 */
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('categories').select('count').limit(1);
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        const { logger } = await import('./utils/logger');
        logger.error('خطأ في الاتصال بـ Supabase:', error);
      }
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      const { logger } = await import('./utils/logger');
      logger.error('استثناء في الاتصال بـ Supabase:', err);
    }
    return { connected: false, error: err.message };
  }
}

// تصدير createClient للاستخدام في مواضع أخرى
export { createClient } from '@supabase/supabase-js';

/**
 * فحص ما إذا كان المستخدم مسؤولاً
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // تحقق من قاعدة البيانات إذا كان المستخدم مسؤولاً
    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    return !!adminData && !error;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      const { logger } = await import('./utils/logger');
      logger.error('خطأ في التحقق من صلاحيات الإدارة:', error);
    }
    return false;
  }
}

/**
 * استرجاع الإحصاءات الحقيقية من قاعدة البيانات
 */
export async function getDashboardStats() {
  try {
    // عدد المنتجات
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // عدد التصنيفات
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // عدد الطلبات
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // عدد المستخدمين
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    return {
      products: productsCount?.toString() || '0',
      categories: categoriesCount?.toString() || '0',
      orders: ordersCount?.toString() || '0',
      users: usersCount?.toString() || '0',
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      const { logger } = await import('./utils/logger');
      logger.error('خطأ في استرجاع إحصاءات لوحة التحكم:', error);
    }
    return {
      products: '0',
      categories: '0',
      orders: '0',
      users: '0',
    };
  }
}