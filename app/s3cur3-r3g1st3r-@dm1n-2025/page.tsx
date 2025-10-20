'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, UserPlus, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';

export default function SecureRegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    invitationCode: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { settings } = useSiteSettings();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.email.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (!formData.password.trim()) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (!formData.invitationCode.trim()) {
      toast.error('يرجى إدخال كود الدعوة');
      return;
    }

    if (formData.invitationCode.length !== 6) {
      toast.error('كود الدعوة يجب أن يكون 6 أرقام');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📤 إرسال طلب التسجيل...');
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📨 استلام الرد:', response.status);
      const result = await response.json();
      console.log('📋 بيانات الرد:', result);

      if (result.success) {
        localStorage.setItem('admin_user', JSON.stringify(result.adminUser));
        toast.success('تم إنشاء الحساب بنجاح! جاري التحويل...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        toast.error(result.message || 'فشل في إنشاء الحساب');
      }
    } catch (error) {
      console.error('❌ خطأ:', error);
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-center">
          <Link href="/admin" className="flex items-center text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-5 h-5 ml-1" />
            <span>تسجيل الدخول</span>
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
                alt="Logo"
                fill
                sizes="80px"
                className="object-contain"
              />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            إنشاء حساب سوبر أدمن
          </h2>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            نظام آمن 100% - تشفير كامل
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-right">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>تعليمات:</strong><br />
              • احصل على كود الدعوة (6 أرقام) من مدير النظام<br />
              • استخدم بريد إلكتروني صالح<br />
              • كلمة المرور يجب أن تكون قوية (8 أحرف على الأقل)<br />
              • رقم الهاتف اختياري
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {/* Invitation Code */}
          <div>
            <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 mb-1">
              كود الدعوة (6 أرقام) <span className="text-red-500">*</span>
            </label>
            <input
              id="invitationCode"
              name="invitationCode"
              type="text"
              required
              value={formData.invitationCode}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              maxLength={6}
              pattern="[0-9]{6}"
              autoComplete="off"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all text-center text-lg tracking-widest font-mono"
              placeholder="123456"
            />
            <p className="mt-1 text-xs text-gray-500">احصل على الكود من مدير النظام</p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              autoComplete="off"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              placeholder="admin@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">مثال: admin@alagayebi.com</p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                autoComplete="new-password"
                className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                placeholder="أدخل كلمة مرور قوية"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">يجب أن تحتوي على 8 أحرف على الأقل (مثال: Alagayebi@2025)</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              تأكيد كلمة المرور <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                autoComplete="new-password"
                className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                placeholder="أعد إدخال كلمة المرور"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">يجب أن تطابق كلمة المرور السابقة</p>
          </div>

          {/* Phone (Optional) */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              رقم الهاتف (اختياري)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              autoComplete="tel"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              placeholder="01068533530"
            />
            <p className="mt-1 text-xs text-gray-500">مثال: 01068533530 (غير إلزامي)</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جاري إنشاء الحساب...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 ml-2" />
                إنشاء حساب سوبر أدمن
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
