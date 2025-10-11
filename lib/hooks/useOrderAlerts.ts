'use client';

import { useMemo, useEffect, useState } from 'react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  total: number;
  total_profit?: number;
  customer_phone: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  count: number;
  orders: string[];
  severity: number;
}

export function useOrderAlerts(orders: Order[]) {
  const [lastAlertTime, setLastAlertTime] = useState<Date>(new Date());

  // تحليل الطلبات وإنشاء تنبيهات ذكية
  const alerts = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return [];

    const now = new Date();
    const alerts: Alert[] = [];

    // الطلبات العالقة في الانتظار
    const pendingOrders = orders.filter(order => {
      const daysSince = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return order.status === 'pending' && daysSince >= 1;
    });

    if (pendingOrders.length > 0) {
      alerts.push({
        id: 'pending-orders',
        type: 'critical',
        title: 'طلبات عالقة في الانتظار',
        message: `${pendingOrders.length} طلب لم يتم تأكيده منذ أكثر من 24 ساعة`,
        count: pendingOrders.length,
        orders: pendingOrders.map(o => o.id),
        severity: 10
      });
    }

    // طلبات الاستبدال التي تحتاج معالجة
    const replacementOrders = orders.filter(order =>
      order.status === 'replacement_requested'
    );

    if (replacementOrders.length > 0) {
      alerts.push({
        id: 'replacement-requests',
        type: 'critical',
        title: 'طلبات استبدال تحتاج معالجة',
        message: `${replacementOrders.length} طلب استبدال في انتظار المعالجة`,
        count: replacementOrders.length,
        orders: replacementOrders.map(o => o.id),
        severity: 9
      });
    }

    // الطلبات المسلّمة بدون تحصيل دفع
    const unpaidDeliveredOrders = orders.filter(order =>
      order.status === 'delivered' && order.payment_status !== 'collected'
    );

    if (unpaidDeliveredOrders.length > 0) {
      alerts.push({
        id: 'unpaid-delivered',
        type: 'critical',
        title: 'طلبات مسلّمة لم يتم تحصيل دفعها',
        message: `${unpaidDeliveredOrders.length} طلب تم تسليمه ولكن لم يتم تحصيل المبلغ`,
        count: unpaidDeliveredOrders.length,
        orders: unpaidDeliveredOrders.map(o => o.id),
        severity: 8
      });
    }

    // الطلبات الخاسرة
    const lossOrders = orders.filter(order =>
      order.total_profit !== undefined &&
      order.total_profit < 0 &&
      order.status !== 'cancelled'
    );

    if (lossOrders.length > 0) {
      const totalLoss = lossOrders.reduce((sum, order) => sum + Math.abs(order.total_profit || 0), 0);
      alerts.push({
        id: 'loss-orders',
        type: 'warning',
        title: 'طلبات تحقق خسائر',
        message: `${lossOrders.length} طلب يحقق خسارة إجمالية ${totalLoss.toFixed(2)} جنيه`,
        count: lossOrders.length,
        orders: lossOrders.map(o => o.id),
        severity: 6
      });
    }

    // الطلبات المؤكدة التي لم يتم شحنها
    const confirmedNotShippedOrders = orders.filter(order => {
      const daysSince = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return order.status === 'confirmed' && daysSince >= 2;
    });

    if (confirmedNotShippedOrders.length > 0) {
      alerts.push({
        id: 'confirmed-not-shipped',
        type: 'warning',
        title: 'طلبات مؤكدة لم يتم شحنها',
        message: `${confirmedNotShippedOrders.length} طلب مؤكد منذ أكثر من 48 ساعة ولم يتم شحنه`,
        count: confirmedNotShippedOrders.length,
        orders: confirmedNotShippedOrders.map(o => o.id),
        severity: 7
      });
    }

    // الطلبات المشحونة لفترة طويلة
    const longShippedOrders = orders.filter(order => {
      const daysSince = Math.floor((now.getTime() - new Date(order.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return order.status === 'shipped' && daysSince >= 5;
    });

    if (longShippedOrders.length > 0) {
      alerts.push({
        id: 'long-shipped',
        type: 'warning',
        title: 'طلبات مشحونة لفترة طويلة',
        message: `${longShippedOrders.length} طلب مشحون منذ أكثر من 5 أيام، تحقق من حالة التسليم`,
        count: longShippedOrders.length,
        orders: longShippedOrders.map(o => o.id),
        severity: 5
      });
    }

    // طلبات بدون أرقام هواتف صحيحة
    const invalidPhoneOrders = orders.filter(order =>
      !order.customer_phone || order.customer_phone.length < 10
    );

    if (invalidPhoneOrders.length > 0) {
      alerts.push({
        id: 'invalid-phone',
        type: 'info',
        title: 'طلبات بدون أرقام هواتف صحيحة',
        message: `${invalidPhoneOrders.length} طلب يحتاج تحديث رقم الهاتف`,
        count: invalidPhoneOrders.length,
        orders: invalidPhoneOrders.map(o => o.id),
        severity: 3
      });
    }

    // ترتيب التنبيهات حسب الأولوية
    return alerts.sort((a, b) => b.severity - a.severity);
  }, [orders]);

  // حساب إجمالي التنبيهات النشطة
  const criticalCount = alerts.filter(alert => alert.type === 'critical').length;
  const warningCount = alerts.filter(alert => alert.type === 'warning').length;
  const totalCount = alerts.length;

  // تحديد ما إذا كانت هناك تنبيهات جديدة
  const hasNewAlerts = useMemo(() => {
    if (alerts.length === 0) return false;
    return alerts.some(alert => alert.type === 'critical');
  }, [alerts]);

  // إعادة تعيين وقت آخر تنبيه عند فتح القائمة
  const markAlertsAsViewed = () => {
    setLastAlertTime(new Date());
  };

  return {
    alerts,
    criticalCount,
    warningCount,
    totalCount,
    hasNewAlerts,
    markAlertsAsViewed
  };
}