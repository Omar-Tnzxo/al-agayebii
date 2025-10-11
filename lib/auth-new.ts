import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// نوع بيانات المدير
export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  phone?: string;
}

// إنشاء عميل Supabase
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { 'x-application-name': 'al-agayebi-store' },
    },
  });
}

// التحقق من المصادقة للمدير
export async function verifyAdminAuth(email: string, password: string): Promise<AdminUser | null> {
  try {
    const supabase = createSupabaseClient();

    console.log('Attempting login for:', email);

    // 1. البحث عن المدير في جدول admin_users
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, email, role, created_at, phone, password_hash, is_active')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (fetchError) {
      console.error('خطأ في جلب بيانات المدير:', fetchError.message);
      return null;
    }

    if (!adminUser) {
      console.log('المستخدم غير موجود أو غير نشط');
      return null;
    }

    console.log('تم العثور على المستخدم:', adminUser.email);

    // 2. التحقق من كلمة المرور
    if (adminUser.password_hash) {
      // إذا كانت كلمة المرور مشفرة، استخدم bcrypt
      const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
      if (!isValidPassword) {
        console.log('كلمة المرور غير صحيحة (مشفرة)');
        return null;
      }
    } else {
      // كلمة المرور غير مشفرة (للتطوير فقط)
      console.log('تحذير: كلمة المرور غير مشفرة');
      return null;
    }

    console.log('تم التحقق من كلمة المرور بنجاح');

    // 3. إرجاع بيانات المدير
    return {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role || 'admin',
      created_at: adminUser.created_at,
      phone: adminUser.phone,
    };

  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    return null;
  }
}

// دالة لتشفير كلمة المرور (للاستخدام عند إنشاء مدير جديد)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// دالة لإنشاء مدير جديد
export async function createAdminUser(email: string, password: string, role = 'admin', phone?: string): Promise<AdminUser | null> {
  try {
    const supabase = createSupabaseClient();
    
    // تشفير كلمة المرور
    const passwordHash = await hashPassword(password);
    
    // إدراج المدير الجديد
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        email,
        password_hash: passwordHash,
        role,
        phone,
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('خطأ في إنشاء المدير:', error.message);
      return null;
    }
    
    return {
      id: newAdmin.id,
      email: newAdmin.email,
      role: newAdmin.role,
      created_at: newAdmin.created_at,
      phone: newAdmin.phone,
    };
    
  } catch (error) {
    console.error('خطأ في إنشاء المدير:', error);
    return null;
  }
}

// دالة لتسجيل الخروج
export async function signOut(): Promise<void> {
  try {
    // مسح البيانات من التخزين المحلي
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_user');
    }
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
  }
}

// التحقق من الجلسة الحالية
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    
    const storedUser = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
    
    if (!storedUser) {
      return null;
    }
    
    return JSON.parse(storedUser) as AdminUser;
  } catch (error) {
    console.error('خطأ في جلب المدير الحالي:', error);
    return null;
  }
}