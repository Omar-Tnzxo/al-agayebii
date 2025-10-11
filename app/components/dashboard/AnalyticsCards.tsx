'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Percent,
  Bell,
  Truck,
  RotateCcw,
  RefreshCw,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

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
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  isLoading?: boolean;
}

const MetricCard = ({ title, value, icon: Icon, trend, color, isLoading }: MetricCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-emerald-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white',
    indigo: 'bg-indigo-500 text-white'
  };

  const bgClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-emerald-50 border-emerald-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
    indigo: 'bg-indigo-50 border-indigo-200'
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="w-16 h-5 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-4">
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-100 rounded mt-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgClasses[color]} rounded-2xl shadow-sm border p-6 relative overflow-hidden`}>
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>

        {trend !== undefined && (
          <div className="flex items-center">
            {trend >= 0 ? (
              <div className="flex items-center text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full text-xs font-medium">
                <TrendingUp className="h-3 w-3 ml-1" />
                {trend.toFixed(1)}%
              </div>
            ) : (
              <div className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-medium">
                <TrendingDown className="h-3 w-3 ml-1" />
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 relative z-10">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </div>

      {/* خلفية زخرفية */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <Icon className="h-32 w-32 absolute -top-4 -left-4 text-gray-900" />
      </div>
    </div>
  );
};

interface AnalyticsCardsProps {
  data: AnalyticsData | null;
  isLoading: boolean;
}

export default function AnalyticsCards({ data, isLoading }: AnalyticsCardsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="إجمالي المبيعات"
        value={data ? formatPrice(data.overview.totalRevenue) : '0 ج.م'}
        icon={DollarSign}
        trend={data?.overview.salesGrowth}
        color="green"
        isLoading={isLoading}
      />

      <MetricCard
        title="صافي الربح"
        value={data ? formatPrice(data.overview.totalProfit) : '0 ج.م'}
        icon={TrendingUp}
        color="blue"
        isLoading={isLoading}
      />

      <MetricCard
        title="إجمالي الطلبات"
        value={data ? data.overview.totalOrders.toString() : '0'}
        icon={ShoppingBag}
        color="purple"
        isLoading={isLoading}
      />

      <MetricCard
        title="متوسط قيمة الطلب"
        value={data ? formatPrice(data.overview.averageOrderValue) : '0 ج.م'}
        icon={Package}
        color="orange"
        isLoading={isLoading}
      />

      <MetricCard
        title="إجمالي المنتجات"
        value={data ? data.overview.totalProducts.toString() : '0'}
        icon={Package}
        color="indigo"
        isLoading={isLoading}
      />

      <MetricCard
        title="معدل التحويل"
        value={data ? `${data.overview.conversionRate.toFixed(1)}%` : '0%'}
        icon={Percent}
        color="green"
        isLoading={isLoading}
      />

      <MetricCard
        title="التصنيفات"
        value={data ? data.overview.totalCategories.toString() : '0'}
        icon={Users}
        color="blue"
        isLoading={isLoading}
      />

      <MetricCard
        title="الإشعارات الجديدة"
        value={data ? data.overview.unreadNotifications.toString() : '0'}
        icon={Bell}
        color="red"
        isLoading={isLoading}
      />

      {/* إحصائيات السوق المصري */}
      <MetricCard
        title="معدل التسليم الناجح"
        value={data ? `${data.overview.deliverySuccessRate.toFixed(1)}%` : '0%'}
        icon={Truck}
        color="green"
        isLoading={isLoading}
      />

      <MetricCard
        title="معدل الإرجاع"
        value={data ? `${data.overview.returnRate.toFixed(1)}%` : '0%'}
        icon={RotateCcw}
        color="red"
        isLoading={isLoading}
      />

      <MetricCard
        title="معدل الاستبدال"
        value={data ? `${data.overview.replacementRate.toFixed(1)}%` : '0%'}
        icon={RefreshCw}
        color="orange"
        isLoading={isLoading}
      />

      <MetricCard
        title="نسبة الدفع عند الاستلام"
        value={data ? `${data.overview.cashOnDeliveryRate.toFixed(1)}%` : '0%'}
        icon={CreditCard}
        color="blue"
        isLoading={isLoading}
      />

      <MetricCard
        title="معدل التحصيل"
        value={data ? `${data.overview.collectionRate.toFixed(1)}%` : '0%'}
        icon={CheckCircle2}
        color="purple"
        isLoading={isLoading}
      />
    </div>
  );
}