'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();
  const { settings } = useSiteSettings();

  // عرض رسالة من URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
      toast.error(decodeURIComponent(message));
      // مسح الرسالة من URL
      window.history.replaceState({}, '', '/admin');
    }
  }, []);

  // التحقق من الجلسة الحالية
  useEffect(() => {
    const checkSession = async () => {
      try {
        // التحقق من التخزين المحلي أولاً
        const adminUser = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
        
        // التحقق من صحة الجلسة عبر API
        const response = await fetch('/api/admin/check-session', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.adminUser) {
            // حفظ بيانات المستخدم إذا لم تكن موجودة
            if (!adminUser) {
              const storage = rememberMe ? localStorage : sessionStorage;
              storage.setItem('admin_user', JSON.stringify(data.adminUser));
            }
            router.replace('/dashboard');
            return;
          }
        }
        
        // مسح أي بيانات قديمة إذا كانت الجلسة غير صالحة
        localStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_user');
      } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        // مسح البيانات في حالة الخطأ
        localStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_user');
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [router, rememberMe]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async () => {
    // التحقق من البيانات
    if (!formData.email.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (!formData.password.trim()) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.adminUser) {
        // حفظ بيانات المدير في التخزين المناسب
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('admin_user', JSON.stringify(result.adminUser));

        toast.success('تم تسجيل الدخول بنجاح');

        // الانتقال مباشرة إلى لوحة التحكم
        window.location.href = '/dashboard';
      } else {
        toast.error(result.message || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  // عرض شاشة تحميل أثناء التحقق من الجلسة
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-gray-600">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-5 h-5 ml-1" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        <div className="text-center">
          <div className="mx-auto w-20 h-20 relative mb-4">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={settings.siteName || 'Logo'}
                fill
                sizes="80px"
                className="object-contain"
              />
            ) : (
              <Image
                src="/logo.png"
                alt="شعار متجر العجايبي"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة التحكم
          </h2>
          <p className="text-sm text-gray-600">
            قم بتسجيل الدخول للوصول إلى لوحة التحكم
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-700">
                تذكرني
              </label>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 ml-2" />
                تسجيل الدخول
              </>
            )}
          </button>

          <div className="text-center text-sm">
            <p className="text-gray-600">
              نظام آمن 100% محمي بأحدث تقنيات الأمان
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
