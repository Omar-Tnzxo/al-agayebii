import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// احصل على متغيرات البيئة من ملف .env.local أو استخدم القيم الافتراضية الصحيحة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// تحقق من توفر متغيرات البيئة المطلوبة
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('متغيرات البيئة الخاصة بـ Supabase غير متوفرة. استخدام القيم الافتراضية');
}

import { logger } from './utils/logger';

logger.info('🔧 إعدادات Supabase:', {
  url: supabaseUrl,
  anonKeyLength: supabaseAnonKey.length,
  hasEnvVars: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
});

/**
 * إنشاء عميل Supabase للاستخدام في المستعرض
 * مع تكوين إضافي للاستعادة التلقائية
 */
export const supabase = createClient<Database>(
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

/**
 * فحص اتصال Supabase والتحقق من صحته
 * يمكن استخدام هذه الوظيفة للتحقق من الاتصال قبل إجراء العمليات
 */
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('categories').select('count').limit(1);
    if (error) {
      logger.error('خطأ في الاتصال بـ Supabase:', error);
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err: any) {
    logger.error('استثناء في الاتصال بـ Supabase:', err);
    return { connected: false, error: err.message };
  }
}

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
    logger.error('خطأ في التحقق من صلاحيات الإدارة:', error);
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
    logger.error('خطأ في استرجاع إحصاءات لوحة التحكم:', error);
    return {
      products: '0',
      categories: '0',
      orders: '0',
      users: '0',
    };
  }
} 