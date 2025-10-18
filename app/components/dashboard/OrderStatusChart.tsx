'use client';

import { PieChart, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface OrderStatusData {
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
  overview: {
    totalOrders: number;
  };
}

interface OrderStatusChartProps {
  data: OrderStatusData | null;
  isLoading: boolean;
}

export default function OrderStatusChart({ data, isLoading }: OrderStatusChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data || data.overview.totalOrders === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p>لا توجد طلبات متاحة</p>
          </div>
        </div>
      </div>
    );
  }

  const statusData = [
    {
      label: 'في الانتظار',
      value: data.orderStatus.pending,
      color: 'bg-yellow-500',
      icon: Clock,
      borderColor: 'border-yellow-200',
      bgColor: 'bg-yellow-50'
    },
    {
      label: 'مؤكد',
      value: data.orderStatus.confirmed,
      color: 'bg-blue-500',
      icon: CheckCircle,
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'تم الشحن',
      value: data.orderStatus.shipped,
      color: 'bg-purple-500',
      icon: AlertCircle,
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'تم التسليم',
      value: data.orderStatus.delivered,
      color: 'bg-emerald-500',
      icon: CheckCircle,
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'طلب استبدال',
      value: data.orderStatus.replacement_requested,
      color: 'bg-orange-500',
      icon: AlertCircle,
      borderColor: 'border-orange-200',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'مرتجع',
      value: data.orderStatus.returned,
      color: 'bg-red-500',
      icon: XCircle,
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50'
    }
  ];

  const total = data.overview.totalOrders;

  // حساب الزوايا للدائرة
  let currentAngle = 0;
  const segments = statusData.map(status => {
    const percentage = total > 0 ? (status.value / total) * 100 : 0;
    const angle = (status.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...status,
      percentage,
      angle,
      startAngle
    };
  });

  const createPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <PieChart className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">توزيع حالات الطلبات</h3>
          <p className="text-sm text-gray-600">إجمالي {total} طلب</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* الرسم البياني الدائري */}
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {segments.map((segment, index) => {
              const colors = ['#eab308', '#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ef4444']; // yellow, blue, purple, emerald, orange, red
              return segment.value > 0 ? (
                <path
                  key={index}
                  d={createPath(100, 100, 80, segment.startAngle, segment.startAngle + segment.angle)}
                  fill={colors[index]}
                  className="hover:opacity-80 transition-opacity"
                />
              ) : null;
            })}

            {/* الدائرة الداخلية */}
            <circle cx="100" cy="100" r="40" fill="white" />
          </svg>

          {/* النص في المنتصف */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-600">إجمالي الطلبات</div>
            </div>
          </div>
        </div>

        {/* مؤشرات الألوان والإحصائيات */}
        <div className="flex-1 mr-8">
          <div className="space-y-4">
            {statusData.map((status, index) => {
              const percentage = total > 0 ? ((status.value / total) * 100).toFixed(1) : '0';
              const Icon = status.icon;

              return (
                <div
                  key={status.label}
                  className={`${status.bgColor} ${status.borderColor} border rounded-lg p-4 transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${status.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{status.label}</div>
                        <div className="text-sm text-gray-600">{status.value} طلب</div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-lg font-bold text-gray-900">{percentage}%</div>
                    </div>
                  </div>

                  {/* شريط التقدم */}
                  <div className="mt-3 bg-white bg-opacity-50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}