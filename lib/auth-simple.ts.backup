// نظام مصادقة مبسط يعمل بدون قاعدة بيانات للتطوير السريع

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  phone?: string;
}

// بيانات المديرين الثابتة للتطوير
const ADMIN_ACCOUNTS: Record<string, { password: string; data: AdminUser }> = {
  'admin@alagayebi.com': {
    password: 'admin123',
    data: {
      id: 'admin-1',
      email: 'admin@alagayebi.com',
      role: 'admin',
      created_at: new Date().toISOString(),
      phone: '+201234567890'
    }
  },
  'omar@admin.com': {
    password: '12345678',
    data: {
      id: 'admin-2', 
      email: 'omar@admin.com',
      role: 'admin',
      created_at: new Date().toISOString(),
      phone: '+201234567891'
    }
  },
  'admin@gmail.com': {
    password: 'admin',
    data: {
      id: 'admin-3',
      email: 'admin@gmail.com', 
      role: 'admin',
      created_at: new Date().toISOString(),
    }
  }
};

// التحقق من المصادقة للمدير
export async function verifyAdminAuth(email: string, password: string): Promise<AdminUser | null> {
  console.log('🔍 محاولة تسجيل دخول لـ:', email);
  
  // تحقق من الحساب في القائمة الثابتة
  const account = ADMIN_ACCOUNTS[email.toLowerCase()];
  
  if (!account) {
    console.log('❌ الحساب غير موجود');
    return null;
  }
  
  if (account.password !== password) {
    console.log('❌ كلمة المرور غير صحيحة');
    return null;
  }
  
  console.log('✅ تم التحقق بنجاح');
  return account.data;
}

// دالة لتسجيل الخروج
export async function signOut(): Promise<void> {
  try {
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

// عرض قائمة المديرين المتاحين
export function getAvailableAdmins(): Array<{ email: string; password: string }> {
  return Object.entries(ADMIN_ACCOUNTS).map(([email, account]) => ({
    email,
    password: account.password
  }));
}