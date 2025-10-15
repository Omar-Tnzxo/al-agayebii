'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, Clock, TrendingUp, X, Eye } from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  total_cost?: number;
  total_profit?: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  shipping_cost: number;
}

interface Notification {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  timestamp: Date;
  priority: number;
}

interface OrderNotificationsProps {
  orders: Order[];
  onOrderSelect?: (orderId: string) => void;
}

export default function OrderNotifications({ orders, onOrderSelect }: OrderNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  // توليد الإشعارات الذكية
  const notifications = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return [];

    const now = new Date();
    const notifs: Notification[] = [];

    orders.forEach(order => {
      if (!order) return;

      const orderDate = new Date(order.created_at);
      const updatedDate = new Date(order.updated_at);
      const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      const hoursSinceUpdate = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60));

      // طلبات عالقة في الانتظار لأكثر من 24 ساعة
      if (order.status === 'pending' && daysSinceOrder >= 1) {
        notifs.push({
          id: `pending-${order.id}`,
          type: 'urgent',
          title: 'طلب عالق في الانتظار',
          message: `الطلب ${order.order_number} للعميل ${order.customer_name} في الانتظار منذ ${daysSinceOrder} يوم`,
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: orderDate,
          priority: 10 + daysSinceOrder
        });
      }

      // طلبات مؤكدة لم يتم شحنها بعد 2 أيام
      if (order.status === 'confirmed' && daysSinceOrder >= 2) {
        notifs.push({
          id: `confirmed-${order.id}`,
          type: 'warning',
          title: 'طلب مؤكد لم يتم شحنه',
          message: `الطلب ${order.order_number} مؤكد منذ ${daysSinceOrder} يوم ولم يتم شحنه بعد`,
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: orderDate,
          priority: 8 + daysSinceOrder
        });
      }

      // طلبات مشحونة لأكثر من 5 أيام
      if (order.status === 'shipped' && daysSinceOrder >= 5) {
        notifs.push({
          id: `shipped-${order.id}`,
          type: 'warning',
          title: 'طلب مشحون منذ فترة طويلة',
          message: `الطلب ${order.order_number} مشحون منذ ${daysSinceOrder} يوم، تحقق من حالة التسليم`,
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: orderDate,
          priority: 7 + Math.min(daysSinceOrder - 5, 5)
        });
      }

      // طلبات استبدال لم يتم التعامل معها
      if (order.status === 'replacement_requested' && hoursSinceUpdate >= 12) {
        notifs.push({
          id: `replacement-${order.id}`,
          type: 'urgent',
          title: 'طلب استبدال يحتاج معالجة',
          message: `العميل ${order.customer_name} طلب استبدال للطلب ${order.order_number}`,
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: updatedDate,
          priority: 15
        });
      }

      // طلبات خاسرة (ربح سالب)
      if (order.total_profit !== undefined && order.total_profit < 0 && order.status !== 'cancelled') {
        notifs.push({
          id: `loss-${order.id}`,
          type: 'warning',
          title: 'طلب بخسارة مالية',
          message: `الطلب ${order.order_number} يحقق خسارة ${formatPrice(Math.abs(order.total_profit))}`,
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: orderDate,
          priority: 6
        });
      }

      // طلبات بدون رقم هاتف صحيح
      if (!order.customer_phone || order.customer_phone.length < 10) {
        notifs.push({
          id: `phone-${order.id}`,
          type: 'warning',
          title: 'رقم هاتف ناقص',
          message: `الطلب ${order.order_number} لا يحتوي على رقم هاتف صحيح`,
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: orderDate,
          priority: 4
        });
      }

      // دفع لم يتم تحصيله لطلبات مسلّمة
      if (order.status === 'delivered' && order.payment_status !== 'collected') {
        notifs.push({
          id: `payment-${order.id}`,
          type: 'urgent',
          title: 'دفع لم يتم تحصيله',
          message: `الطلب ${order.order_number} تم تسليمه ولكن لم يتم تحصيل الدفع`,
          orderId: order.id,
          orderNumber: order.order_number,
          timestamp: updatedDate,
          priority: 12
        });
      }
    });

    // ترتيب الإشعارات حسب الأولوية والوقت
    return notifs
      .filter(notif => !dismissedNotifications.includes(notif.id))
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, 10); // أقصى 10 إشعارات
  }, [orders, dismissedNotifications]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const urgent = notifications.filter(n => n.type === 'urgent').length;
    const warnings = notifications.filter(n => n.type === 'warning').length;
    const total = notifications.length;

    return { urgent, warnings, total };
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const dismissNotification = (notificationId: string) => {
    setDismissedNotifications(prev => [...prev, notificationId]);
  };

  const handleOrderClick = (orderId?: string) => {
    if (orderId && onOrderSelect) {
      onOrderSelect(orderId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* زر الإشعارات */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {stats.total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {stats.total > 9 ? '9+' : stats.total}
          </span>
        )}
      </button>

      {/* قائمة الإشعارات */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* عنوان */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">الإشعارات الذكية</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {stats.total > 0 && (
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-red-600">عاجل: {stats.urgent}</span>
                <span className="text-yellow-600">تحذير: {stats.warnings}</span>
                <span className="text-gray-600">المجموع: {stats.total}</span>
              </div>
            )}
          </div>

          {/* قائمة الإشعارات */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد إشعارات جديدة</p>
                <p className="text-sm mt-1">جميع الطلبات تسير بشكل طبيعي</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 ${getNotificationStyle(notification.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.timestamp.toLocaleString('en-US')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {notification.orderId && (
                            <button
                              onClick={() => handleOrderClick(notification.orderId)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="عرض الطلب"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            title="إخفاء الإشعار"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* تذييل */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setDismissedNotifications(notifications.map(n => n.id))}
                className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                إخفاء جميع الإشعارات
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}