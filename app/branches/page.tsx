'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Clock, Navigation, Mail, ChevronLeft, ExternalLink, Store } from 'lucide-react';
import Link from 'next/link';
import type { Branch } from '@/lib/types/branch';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/branches?active=true');
      const result = await response.json();

      if (result.success) {
        setBranches(result.data || []);
      } else {
        setError(result.error || 'فشل في جلب الفروع');
      }
    } catch (error) {
      console.error('خطأ في جلب الفروع:', error);
      setError('حدث خطأ أثناء تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto py-16 px-4">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
            <p className="text-gray-600 text-lg">جاري تحميل الفروع...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto py-16 px-4">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchBranches}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (branches.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto py-16 px-4">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Store className="w-24 h-24 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">لا توجد فروع حالياً</h2>
            <p className="text-gray-500">نعمل على إضافة فروع جديدة قريباً</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-medium">فروعنا في خدمتكم</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              زوروا أحد فروعنا
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              نوفر لكم {branches.length} {branches.length === 1 ? 'فرع' : branches.length === 2 ? 'فرعين' : 'فروع'} في مواقع متميزة
              <br />
              للحصول على أفضل المنتجات والخدمات
            </p>
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20"
            >
              {/* Header with Branch Name */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-white rounded-full p-3">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {branch.name}
                      </h2>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    نشط
                  </div>
                </div>
              </div>

              {/* Branch Details */}
              <div className="p-6 space-y-5">
                {/* Address */}
                <div className="flex items-start gap-4 group/item">
                  <div className="bg-primary/10 rounded-lg p-2.5 group-hover/item:bg-primary/20 transition-colors">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700 mb-1">العنوان</p>
                    <p className="text-gray-600 leading-relaxed">{branch.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-sm font-medium">
                        {branch.governorate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 group/item">
                  <div className="bg-green-50 rounded-lg p-2.5 group-hover/item:bg-green-100 transition-colors">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700 mb-1">رقم الهاتف</p>
                    <a
                      href={`tel:${branch.phone}`}
                      className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-2 group"
                      dir="ltr"
                    >
                      {branch.phone}
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>

                {/* Email */}
                {branch.email && (
                  <div className="flex items-start gap-4 group/item">
                    <div className="bg-purple-50 rounded-lg p-2.5 group-hover/item:bg-purple-100 transition-colors">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-700 mb-1">البريد الإلكتروني</p>
                      <a
                        href={`mailto:${branch.email}`}
                        className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-2 group"
                      >
                        {branch.email}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Working Hours */}
                {branch.working_hours && (
                  <div className="flex items-start gap-4 group/item">
                    <div className="bg-orange-50 rounded-lg p-2.5 group-hover/item:bg-orange-100 transition-colors">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-700 mb-1">ساعات العمل</p>
                      <p className="text-gray-600">{branch.working_hours}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex gap-3">
                {branch.google_maps_url && (
                  <a
                    href={branch.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-all duration-300 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 group"
                  >
                    <Navigation className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                    <span>عرض على الخريطة</span>
                  </a>
                )}

                <a
                  href={`tel:${branch.phone}`}
                  className="flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-xl border-2 border-primary hover:bg-primary hover:text-white transition-all duration-300 font-medium group"
                >
                  <Phone className="w-5 h-5 group-hover:animate-pulse" />
                  <span>اتصل بنا</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 md:p-12 border border-primary/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              لا تجد فرع قريب منك؟
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              لا تقلق! يمكنك طلب منتجاتنا عبر المتجر الإلكتروني وسنوصلها إليك أينما كنت
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary-dark transition-all duration-300 font-medium shadow-lg hover:shadow-xl group"
              >
                <span>تسوق الآن</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-3 rounded-xl border-2 border-primary hover:bg-primary hover:text-white transition-all duration-300 font-medium"
              >
                اتصل بنا
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
