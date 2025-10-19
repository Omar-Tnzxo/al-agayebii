/**
 * useOrderAlerts Hook
 * Hook للتعامل مع تنبيهات الطلبات
 */

import { useMemo } from 'react';

export function useOrderAlerts(orders: any[] = []) {
  const alerts = useMemo(() => {
    return orders.map(order => ({
      id: order.id,
      type: order.status === 'pending' ? 'critical' : order.status === 'processing' ? 'warning' : 'info',
      title: `طلب #${order.order_number || order.id}`,
      message: `${order.customer_name} - ${order.status}`
    }));
  }, [orders]);

  const criticalCount = useMemo(() => {
    return orders.filter(order => order.status === 'pending').length;
  }, [orders]);

  const warningCount = useMemo(() => {
    return orders.filter(order => order.status === 'processing').length;
  }, [orders]);

  const totalCount = orders.length;

  return {
    hasNewOrders: orders.length > 0,
    newOrdersCount: orders.length,
    alerts,
    criticalCount,
    warningCount,
    totalCount
  };
}

export default useOrderAlerts;
