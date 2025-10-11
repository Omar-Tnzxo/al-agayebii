'use client';

import Link from 'next/link';
import { Image as ImageIcon, LayoutGrid, ArrowLeft } from 'lucide-react';

export default function HomepageSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">إدارة الصفحة الرئيسية</h1>
        <p className="text-gray-600">تحكم كامل في محتوى وتصميم الصفحة الرئيسية</p>
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Hero Carousel Card */}
        <Link
          href="/dashboard/homepage/hero"
          className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-primary"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-grow">
              <h2 className="text-xl font-bold text-primary mb-2 group-hover:text-blue-600 transition-colors">
                البنر الرئيسي (Hero Carousel)
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                إدارة الصور المتحركة في أعلى الصفحة الرئيسية
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-4">
                <li>• إضافة وتعديل الصور</li>
                <li>• تحديد مدة العرض لكل صورة</li>
                <li>• ترتيب الصور حسب الأولوية</li>
                <li>• إضافة عناوين وأزرار CTA</li>
              </ul>
              <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                <span className="text-sm font-medium">إدارة البنر</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        {/* Homepage Sections Card */}
        <Link
          href="/dashboard/homepage/sections"
          className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-transparent hover:border-primary"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-7 h-7 text-white" />
            </div>
            <div className="flex-grow">
              <h2 className="text-xl font-bold text-primary mb-2 group-hover:text-green-600 transition-colors">
                أقسام المنتجات
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                إنشاء وإدارة أقسام المنتجات الديناميكية
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-4">
                <li>• إضافة أقسام غير محدودة</li>
                <li>• اختيار مصدر المنتجات (تلقائي/يدوي)</li>
                <li>• تحديد التخطيط (شبكة/سلايدر)</li>
                <li>• التحكم في الترتيب والظهور</li>
              </ul>
              <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                <span className="text-sm font-medium">إدارة الأقسام</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Box */}
      <div className="mt-8 max-w-4xl bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 معلومة مهمة</h3>
        <p className="text-blue-800 text-sm">
          نظام الصفحة الرئيسية ديناميكي بالكامل. يمكنك التحكم في كل عنصر يظهر للزوار من خلال هاتين الصفحتين.
          الصفحة الرئيسية ستعرض تلقائياً:
        </p>
        <ol className="text-blue-800 text-sm mt-3 space-y-1 mr-4">
          <li>1. البنر المتحرك (Hero Carousel) - إذا كانت هناك صور مفعّلة</li>
          <li>2. قسم الفئات - يعرض الفئات المتاحة تلقائياً</li>
          <li>3. أقسام المنتجات - حسب الترتيب والإعدادات التي تحددها</li>
        </ol>
      </div>

      {/* Quick Stats (Optional - if you want to show some stats) */}
      <div className="mt-6 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-primary" id="hero-count">-</div>
            <div className="text-xs text-gray-600 mt-1">صور البنر</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600" id="sections-count">-</div>
            <div className="text-xs text-gray-600 mt-1">أقسام المنتجات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600" id="categories-count">-</div>
            <div className="text-xs text-gray-600 mt-1">الفئات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Link href="/" target="_blank" className="text-2xl font-bold text-purple-600 hover:text-purple-700">
              👁️
            </Link>
            <div className="text-xs text-gray-600 mt-1">معاينة الموقع</div>
          </div>
        </div>
      </div>
    </div>
  );
}
