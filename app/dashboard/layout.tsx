'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Package,
  Layers,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ShoppingBag,
  Megaphone,
  Truck,
  MapPin,
  Bell,
  Users,
  Phone,
  Building,
  Image as ImageIcon,
  LayoutGrid,
  Star
} from 'lucide-react';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';
import AdminNotifications from '@/app/components/AdminNotifications';

// مكون عنصر القائمة الجانبية
const SidebarItem = ({ 
  icon: Icon, 
  text, 
  href, 
  active = false,
  onClick
}: { 
  icon: any; 
  text: string; 
  href: string; 
  active?: boolean;
  onClick?: () => void;
}) => (
  <Link 
    href={href}
    onClick={onClick}
    className={`flex items-center text-sm gap-2 py-3 px-4 rounded-md transition-colors ${
      active 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-primary/10'
    }`}
  >
    <Icon className="h-5 w-5" />
    <span>{text}</span>
  </Link>
);

// مكون مجموعة القائمة
const SidebarGroup = ({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode;
}) => (
  <div className="mb-6">
    <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2 px-4">
      {title}
    </h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { settings } = useSiteSettings();

  // التحقق من وجود جلسة مدير على العميل
  useEffect(() => {
    const storedUser =
      typeof window !== 'undefined'
        ? localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user')
        : null;

    if (!storedUser) {
      router.replace('/admin');
    }
  }, [router]);

  // معالج تسجيل الخروج
  const handleLogout = async () => {
    try {
      // استخدام نظام المصادقة المبسط
      const { signOut } = await import('@/lib/auth-simple');
      await signOut();
      
      // إرسال طلب للخادم لمسح الكوكي (اختياري)
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
      } catch (logoutError) {
        console.log('تحذير: فشل في مسح كوكي الخادم', logoutError);
      }
      
      // مسح بيانات المدير من التخزين المحلي أو جلسة التخزين
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_user');
      
      // توجيه إلى صفحة تسجيل الدخول
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      // في حالة فشل تسجيل الخروج، امسح البيانات المحلية على الأقل
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_user');
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* هيدر لوحة التحكم فقط */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
        {/* زر فتح/إغلاق القائمة الجانبية على الهواتف */}
        <button
          type="button"
          className="lg:hidden text-gray-500 hover:text-primary mr-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="sr-only">افتح القائمة</span>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        {/* شعار أو نص */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative h-9 w-9">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={settings.siteName || 'Logo'}
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            ) : (
              <Image 
                src="/logo.png" 
                alt="شعار المتجر" 
                fill 
                sizes="36px" 
                className="object-contain"
                priority
              />
            )}
          </div>
          <span className="text-base font-bold text-primary hidden md:inline">لوحة التحكم</span>
        </Link>
        <div className="flex-1" />
        {/* جرس الإشعارات وزر الخروج */}
        <div className="flex items-center gap-1 sm:gap-2">
          <AdminNotifications />
          <button 
            onClick={handleLogout}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </header>

      {/* محتوى الصفحة الرئيسي */}
      <div className="flex flex-1 overflow-hidden">
        {/* القائمة الجانبية */}
        <aside
          className={`bg-sidebar text-sidebar-foreground w-64 flex-shrink-0 border-l border-sidebar-border flex flex-col transition-all duration-300 fixed inset-y-0 right-0 z-50 lg:relative transform ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          {/* محتوى القائمة الجانبية */}
          <div className="overflow-y-auto flex-1 py-6 px-4">
            {/* القسم الرئيسي */}
            <SidebarGroup title="عام">
              <SidebarItem 
                icon={Home} 
                text="لوحة التحكم" 
                href="/dashboard" 
              />
              <SidebarItem 
                icon={ShoppingBag} 
                text="الطلبات"
                href="/dashboard/orders"
              />
            </SidebarGroup>

            {/* قسم المنتجات */}
            <SidebarGroup title="المنتجات">
              <SidebarItem
                icon={Package}
                text="إدارة المنتجات"
                href="/dashboard/products"
              />
              <SidebarItem
                icon={Layers}
                text="إدارة الفئات"
                href="/dashboard/categories"
              />
              <SidebarItem
                icon={Star}
                text="إدارة التقييمات"
                href="/dashboard/reviews"
              />
            </SidebarGroup>

            {/* قسم الصفحة الرئيسية */}
            <SidebarGroup title="الصفحة الرئيسية">
              <SidebarItem
                icon={Building}
                text="إدارة الصفحة الرئيسية"
                href="/dashboard/homepage-settings"
              />
              <SidebarItem
                icon={ImageIcon}
                text="البنر الرئيسي"
                href="/dashboard/homepage/hero"
              />
              <SidebarItem
                icon={LayoutGrid}
                text="أقسام المنتجات"
                href="/dashboard/homepage/sections"
              />
            </SidebarGroup>

            {/* قسم الشحن والتوصيل */}
            <SidebarGroup title="الشحن والتوصيل">
              <SidebarItem
                icon={Truck}
                text="إعدادات الشحن"
                href="/dashboard/shipping-settings"
              />
              <SidebarItem
                icon={MapPin}
                text="إدارة الفروع"
                href="/dashboard/branches"
              />
            </SidebarGroup>

            {/* قسم التسويق */}
            <SidebarGroup title="التسويق">
              <SidebarItem
                icon={Megaphone}
                text="العروض الترويجية"
                href="/dashboard/promotions"
              />
            </SidebarGroup>

            {/* قسم النظام */}
            <SidebarGroup title="النظام">
              <SidebarItem
                icon={Phone}
                text="صفحة الاتصال"
                href="/dashboard/contact-settings"
              />
              <SidebarItem
                icon={Bell}
                text="الإشعارات"
                href="/dashboard/notifications"
              />
              <SidebarItem
                icon={Settings}
                text="إعدادات الموقع"
                href="/dashboard/settings"
              />
            </SidebarGroup>
          </div>
          {/* زر العودة للموقع وزر تسجيل الخروج */}
          <div className="p-4 border-t border-sidebar-border">
            <Link 
              href="/"
              className="flex items-center text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground gap-2 py-2 px-4 rounded-md hover:bg-sidebar-primary/10 transition-colors w-full"
            >
              <ChevronRight className="h-5 w-5" />
              <span>العودة للموقع</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center text-sm text-red-300 hover:text-red-100 gap-2 py-2 px-4 rounded-md hover:bg-red-500/20 transition-colors w-full mt-2"
            >
              <LogOut className="h-5 w-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>
        {/* محتوى الصفحة الرئيسي */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {/* تظليل خلفي للقائمة الجانبية على الهواتف */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* محتوى الصفحة */}
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 