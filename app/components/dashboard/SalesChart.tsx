'use client';

import { BarChart3, TrendingUp } from 'lucide-react';

interface SalesData {
  charts: {
    monthlySales: [string, number][];
    monthlyProfit: [string, number][];
  };
  dateRange?: {
    period: string;
    isFiltered: boolean;
  };
}

interface SalesChartProps {
  data: SalesData | null;
  isLoading: boolean;
}

export default function SalesChart({ data, isLoading }: SalesChartProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getMaxValue = (salesData: [string, number][], profitData: [string, number][]) => {
    const allValues = [...salesData.map(([, value]) => value), ...profitData.map(([, value]) => value)];
    return Math.max(...allValues, 1);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="w-48 h-6 bg-gray-200 rounded"></div>
            <div className="w-24 h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-80 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.charts.monthlySales.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد بيانات مبيعات متاحة</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = getMaxValue(data.charts.monthlySales, data.charts.monthlyProfit);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">إحصائيات المبيعات والأرباح</h3>
            <p className="text-sm text-gray-600">آخر 6 شهور</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">المبيعات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">الأرباح</span>
          </div>
        </div>
      </div>

      <div className="relative h-80">
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
          {data.charts.monthlySales.map(([month, sales], index) => {
            const profit = data.charts.monthlyProfit[index]?.[1] || 0;
            const salesHeight = (sales / maxValue) * 100;
            const profitHeight = (profit / maxValue) * 100;

            return (
              <div key={month} className="flex flex-col items-center w-full max-w-16">
                <div className="relative w-full h-64 flex items-end justify-center gap-1">
                  {/* عمود المبيعات */}
                  <div className="relative group">
                    <div
                      className="w-6 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${salesHeight}%` }}
                    ></div>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      مبيعات: {formatPrice(sales)}
                    </div>
                  </div>

                  {/* عمود الأرباح */}
                  <div className="relative group">
                    <div
                      className="w-6 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all hover:from-emerald-600 hover:to-emerald-500"
                      style={{ height: `${profitHeight}%` }}
                    ></div>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ربح: {formatPrice(profit)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mt-2 text-center leading-tight">
                  {formatMonth(month)}
                </div>
              </div>
            );
          })}
        </div>

        {/* خطوط المقياس */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 25, 50, 75, 100].map((percentage) => (
            <div
              key={percentage}
              className="absolute w-full border-t border-gray-100"
              style={{ bottom: `${percentage}%` }}
            >
              <span className="absolute right-0 -top-2 text-xs text-gray-400 bg-white px-1">
                {formatPrice((maxValue * percentage) / 100)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}