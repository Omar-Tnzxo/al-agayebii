'use client';

import { Clock, User, DollarSign, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface RecentOrdersProps {
  orders: Order[];
  isLoading: boolean;
}

export default function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    // استخدام تنسيق بسيط لتجنب مشاكل الhydration
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'processing':
        return 'قيد المعالجة';
      case 'shipped':
        return 'تم الشحن';
      case 'completed':
        return 'مكتمل';
      case 'canceled':
        return 'ملغى';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-24 h-3 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">الطلبات الحديثة</h3>
            <p className="text-xs md:text-sm text-gray-600">آخر 5 طلبات</p>
          </div>
        </div>

        <Link
          href="/dashboard/orders"
          className="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          عرض الكل
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-2 md:space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {/* أيقونة الطلب */}
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0">
                  {order.order_number.slice(-2)}
                </div>

                {/* معلومات الطلب */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <h4 className="font-medium text-sm md:text-base text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      #{order.order_number}
                    </h4>
                    <span className={`px-2 py-0.5 md:py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)} w-fit`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs md:text-sm text-gray-600">
                    <span className="flex items-center gap-1 truncate">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{order.customer_name}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs md:text-sm">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(order.created_at)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* قيمة الطلب وزر العرض */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3">
                <div className="text-left">
                  <div className="font-bold text-sm md:text-base text-gray-900">
                    {formatPrice(order.total)}
                  </div>
                </div>

                <Link
                  href={`/dashboard/orders?order_number=${order.order_number}`}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all flex-shrink-0"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">لا توجد طلبات حديثة</p>
        </div>
      )}
    </div>
  );
}