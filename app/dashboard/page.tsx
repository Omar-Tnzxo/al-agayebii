'use client';

import { useEffect, useState } from 'react';
import {
  Settings,
  RefreshCw,
  TrendingUp,
  Activity,
  Calendar,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import AnalyticsCards from '../components/dashboard/AnalyticsCards';
import SalesChart from '../components/dashboard/SalesChart';
import OrderStatusChart from '../components/dashboard/OrderStatusChart';
import TopProducts from '../components/dashboard/TopProducts';
import RecentOrders from '../components/dashboard/RecentOrders';
import DateRangeSelector, { type DateRange } from '../components/dashboard/DateRangeSelector';

interface AnalyticsData {
  overview: {
    totalOrders: number;
    totalProducts: number;
    totalCategories: number;
    totalRevenue: number;
    totalProfit: number;
    averageOrderValue: number;
    conversionRate: number;
    salesGrowth: number;
    unreadNotifications: number;
    deliverySuccessRate: number;
    returnRate: number;
    replacementRate: number;
    cashOnDeliveryRate: number;
    collectionRate: number;
  };
  orderStatus: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    replacement_requested: number;
    replaced: number;
    returned: number;
    cancelled: number;
  };
  charts: {
    monthlySales: [string, number][];
    monthlyProfit: [string, number][];
  };
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    image?: string;
    price: number;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  dateRange: {
    period: string;
    startDate?: string;
    endDate?: string;
    isFiltered: boolean;
  };
}

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    period: 'all',
    label: 'جميع الأوقات'
  });

  // التأكد من أننا في العميل
  useEffect(() => {
    setIsClient(true);
    setLastUpdated(new Date());
  }, []);

  // جلب البيانات التحليلية
  const fetchAnalyticsData = async (dateRange?: DateRange) => {
    try {
      setLoading(true);
      const range = dateRange || selectedDateRange;

      // بناء URL مع المعاملات
      const params = new URLSearchParams();
      params.append('period', range.period);

      if (range.period === 'custom' && range.startDate && range.endDate) {
        params.append('startDate', range.startDate);
        params.append('endDate', range.endDate);
      }

      const response = await fetch(`/api/dashboard/analytics?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setAnalyticsData(result.data);
        setLastUpdated(new Date());
      } else {
        console.error('فشل في جلب البيانات التحليلية');
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات التحليلية:', error);
    } finally {
      setLoading(false);
    }
  };

  // تغيير الفترة الزمنية
  const handleDateRangeChange = (dateRange: DateRange) => {
    setSelectedDateRange(dateRange);
    fetchAnalyticsData(dateRange);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-0">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
          <p className="text-base md:text-lg text-gray-600">نظرة شاملة على أداء متجرك</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {isClient && lastUpdated && (
            <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}
            </div>
          )}

          <div className="w-full sm:w-auto order-1 sm:order-2">
            <DateRangeSelector
              selectedRange={selectedDateRange}
              onRangeChange={handleDateRangeChange}
              isLoading={loading}
            />
          </div>

          <button
            onClick={() => fetchAnalyticsData()}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors order-3"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sm:inline">تحديث</span>
          </button>
        </div>
      </div>

      {/* مؤشر الفترة المحددة */}
      {analyticsData?.dateRange?.isFiltered && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 text-sm md:text-base">
                البيانات محدودة بفترة: {selectedDateRange.label}
              </h3>
              <p className="text-xs md:text-sm text-blue-700 mt-1">
                {isClient && analyticsData.dateRange.startDate && analyticsData.dateRange.endDate ?
                  `من ${new Date(analyticsData.dateRange.startDate).toLocaleDateString('ar-EG')} إلى ${new Date(analyticsData.dateRange.endDate).toLocaleDateString('ar-EG')}` :
                  'البيانات مفلترة حسب الفترة المحددة'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* البطاقات التحليلية */}
      <AnalyticsCards data={analyticsData} isLoading={loading} />

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* رسم المبيعات */}
        <div className="lg:col-span-2">
          <SalesChart data={analyticsData} isLoading={loading} />
        </div>

        {/* توزيع حالات الطلبات */}
        <OrderStatusChart data={analyticsData} isLoading={loading} />

        {/* أفضل المنتجات */}
        <TopProducts
          products={analyticsData?.topProducts || []}
          isLoading={loading}
        />
      </div>

      {/* الطلبات الحديثة */}
      <RecentOrders
        orders={analyticsData?.recentOrders || []}
        isLoading={loading}
      />

      {/* روابط سريعة */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-start sm:items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
            <Activity className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">إجراءات سريعة</h3>
            <p className="text-xs md:text-sm text-gray-600">الوصول السريع للمهام الشائعة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-all group"
          >
            <div className="p-2 bg-blue-500 text-white rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm md:text-base">إضافة منتج</h4>
              <p className="text-xs md:text-sm text-gray-600">منتج جديد للمتجر</p>
            </div>
          </Link>

          <Link
            href="/dashboard/orders"
            className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl hover:shadow-md transition-all group"
          >
            <div className="p-2 bg-emerald-500 text-white rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <Activity className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm md:text-base">إدارة الطلبات</h4>
              <p className="text-xs md:text-sm text-gray-600">متابعة الطلبات</p>
            </div>
          </Link>

          <Link
            href="/dashboard/contact-settings"
            className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl hover:shadow-md transition-all group"
          >
            <div className="p-2 bg-purple-500 text-white rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <Phone className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm md:text-base">صفحة الاتصال</h4>
              <p className="text-xs md:text-sm text-gray-600">إدارة المحتوى</p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl hover:shadow-md transition-all group"
          >
            <div className="p-2 bg-orange-500 text-white rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <Settings className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm md:text-base">الإعدادات</h4>
              <p className="text-xs md:text-sm text-gray-600">إعدادات الموقع</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}