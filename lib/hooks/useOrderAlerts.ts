/**
 * useOrderAlerts Hook
 * Hook للتعامل مع تنبيهات الطلبات
 * ملاحظة: هذا للتوافق مع الكود القديم
 */

import { useEffect } from 'react';

export function useOrderAlerts() {
  useEffect(() => {
    // يمكن إضافة منطق التنبيهات هنا في المستقبل
  }, []);

  return {
    hasNewOrders: false,
    newOrdersCount: 0
  };
}

export default useOrderAlerts;
