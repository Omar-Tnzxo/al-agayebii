'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  X,
  ArrowUpDown,
  Eye,
  Download,
  Printer,
  CheckSquare,
  Square,
  MoreVertical,
  Trash2,
  Edit3,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';
import { handleApiResponse } from '@/lib/utils/handle-api-response';
import { showErrorToast } from '@/lib/utils/show-error-toast';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
import OrderStatusSelector from '@/app/components/OrderStatusSelector';
import PaymentStatusSelector from '@/app/components/PaymentStatusSelector';
import OrderDetailsModal from '@/app/components/OrderDetailsModal';
import AdvancedOrderFilters, { FilterState } from '@/app/components/AdvancedOrderFilters';
import ExportPrintOptions from '@/app/components/ExportPrintOptions';
import OrderNotifications from '@/app/components/OrderNotifications';
import { useOrderAlerts } from '@/lib/hooks/useOrderAlerts';
import { cn } from '@/lib/utils/helpers';

// نوع بيانات الطلب مع الحالات المصرية الجديدة
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'replacement_requested' | 'replaced' | 'returned' | 'cancelled';
type PaymentStatus = 'pending' | 'cash_on_delivery' | 'collected' | 'refund_pending' | 'refunded';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  total_cost?: number;
  total_profit?: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  address: string;
  governorate?: string;
  shipping_cost: number;
  shipping_company?: string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  replacement_requested: 'bg-orange-100 text-orange-800',
  replaced: 'bg-emerald-100 text-emerald-800',
  returned: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'في الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  replacement_requested: 'طلب استبدال',
  replaced: 'تم الاستبدال',
  returned: 'مرتجع',
  cancelled: 'ملغي',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  cash_on_delivery: 'bg-blue-100 text-blue-800',
  collected: 'bg-green-100 text-green-800',
  refund_pending: 'bg-orange-100 text-orange-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'في الانتظار',
  cash_on_delivery: 'دفع عند الاستلام',
  collected: 'تم التحصيل',
  refund_pending: 'في انتظار الإرجاع',
  refunded: 'تم الإرجاع',
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  // Reference للجدول للـ scroll
  const ordersTableRef = useRef<HTMLDivElement>(null);

  // نظام التنبيهات الذكية
  const { alerts, criticalCount, warningCount, totalCount } = useOrderAlerts(orders);
  
  // تتبع الفلتر النشط من الإشعارات
  const [activeAlertFilter, setActiveAlertFilter] = useState<string | null>(null);

  // حالة الفلاتر المتقدمة
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateRange: {
      from: '',
      to: '',
      preset: 'all'
    },
    amountRange: {
      min: '',
      max: ''
    },
    governorate: '',
    shippingCompany: '',
    paymentMethod: '',
    hasProfit: 'all'
  });

  // جلب الطلبات
  useEffect(() => {
    fetchOrders();
  }, []);

  // دعم التحديث الفوري realtime
  useSupabaseRealtime({
    table: 'orders',
    event: '*',
    onChange: () => {
      fetchOrders();
    },
  });

  // تطبيق الفلاتر والبحث والترتيب
  useEffect(() => {
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // البحث
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order && (
          (order.order_number?.toLowerCase() || '').includes(searchLower) ||
          (order.customer_name?.toLowerCase() || '').includes(searchLower) ||
          (order.customer_phone || '').includes(filters.search)
        )
      );
    }

    // فلترة حسب حالة الطلب
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order && order.status === filters.status);
    }

    // فلترة حسب حالة الدفع
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(order => order && order.payment_status === filters.paymentStatus);
    }

    // فلترة حسب نطاق التاريخ
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from);
      filtered = filtered.filter(order => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate >= fromDate;
      });
    }

    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999); // نهاية اليوم
      filtered = filtered.filter(order => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate <= toDate;
      });
    }

    // فلترة حسب نطاق المبلغ
    if (filters.amountRange.min) {
      const minAmount = parseFloat(filters.amountRange.min);
      filtered = filtered.filter(order => order && order.total >= minAmount);
    }

    if (filters.amountRange.max) {
      const maxAmount = parseFloat(filters.amountRange.max);
      filtered = filtered.filter(order => order && order.total <= maxAmount);
    }

    // فلترة حسب المحافظة
    if (filters.governorate) {
      filtered = filtered.filter(order =>
        order && order.governorate &&
        order.governorate.toLowerCase().includes(filters.governorate.toLowerCase())
      );
    }

    // فلترة حسب شركة الشحن
    if (filters.shippingCompany) {
      filtered = filtered.filter(order =>
        order && order.shipping_company &&
        order.shipping_company.toLowerCase().includes(filters.shippingCompany.toLowerCase())
      );
    }

    // فلترة حسب طريقة الدفع
    if (filters.paymentMethod) {
      filtered = filtered.filter(order =>
        order && order.payment_method &&
        order.payment_method.toLowerCase().includes(filters.paymentMethod.toLowerCase())
      );
    }

    // فلترة حسب الربح
    if (filters.hasProfit !== 'all') {
      filtered = filtered.filter(order => {
        if (!order.total_profit && order.total_profit !== 0) return false;

        if (filters.hasProfit === 'profitable') {
          return order.total_profit > 0;
        } else if (filters.hasProfit === 'loss') {
          return order.total_profit < 0;
        }
        return true;
      });
    }

    // الترتيب
    filtered.sort((a, b) => {
      if (!a || !b) return 0;

      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = a.created_at ? new Date(a.created_at) : new Date(0);
          bValue = b.created_at ? new Date(b.created_at) : new Date(0);
          break;
        case 'amount':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1); // إعادة تعيين الصفحة عند التصفية
  }, [orders, filters, sortBy, sortOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await handleApiResponse<any>(fetch('/api/orders'));
      if (error) {
        setError(error);
        return;
      }
      const ordersData = data?.data || data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err: any) {
      console.error('خطأ في جلب الطلبات:', err);
      setError(err.message || 'حدث خطأ في جلب الطلبات');
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة الطلب
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة الطلب');
      }

      // تحديث الطلب في القائمة المحلية
      setOrders(prevOrders =>
        Array.isArray(prevOrders) ? prevOrders.map(order =>
          order && order.id === orderId ? { ...order, status: newStatus as any } : order
        ) : []
      );

      // تحديث البيانات من الخادم للتأكد من التطابق (في حالة التحديثات التلقائية لحالة الدفع)
      setTimeout(() => {
        fetchOrders();
      }, 500);
    } catch (err: any) {
      showErrorToast('حدث خطأ في تحديث حالة الطلب');
    }
  };

  // فتح تفاصيل الطلب
  const handleOpenOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderDetailsOpen(true);
  };

  // إغلاق تفاصيل الطلب
  const handleCloseOrderDetails = () => {
    setSelectedOrderId(null);
    setIsOrderDetailsOpen(false);
  };

  // تحديث الطلبات بعد التعديل في Modal
  const handleOrderUpdate = () => {
    fetchOrders();
  };

  // تحديث الفلاتر
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // إعادة تعيين الفلاتر
  const handleResetFilters = () => {
    console.log('🔄 إعادة تعيين جميع الفلاتر');
    
    // إزالة الفلتر النشط من الإشعارات
    setActiveAlertFilter(null);
    
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      dateRange: {
        from: '',
        to: '',
        preset: 'all'
      },
      amountRange: {
        min: '',
        max: ''
      },
      governorate: '',
      shippingCompany: '',
      paymentMethod: '',
      hasProfit: 'all'
    });
    
    // Reset الصفحة الحالية
    setCurrentPage(1);
  };

  // التحديد المتعدد للطلبات
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    const currentOrderIds = currentOrders.map(order => order.id);
    if (selectedOrders.length === currentOrderIds.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentOrderIds);
    }
  };

  // العمليات الجماعية
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatusType, setBulkStatusType] = useState<'order' | 'payment'>('order');

  // تحديث حالة جماعي
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) return;

    setIsBulkOperating(true);
    try {
      const updatePromises = selectedOrders.map(orderId =>
        fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            bulkStatusType === 'order'
              ? { status: newStatus }
              : { payment_status: newStatus }
          ),
        })
      );

      const results = await Promise.allSettled(updatePromises);

      // تحقق من النتائج
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        showErrorToast(`فشل في تحديث ${failures.length} من ${selectedOrders.length} طلب`);
      } else {
        showErrorToast(`تم تحديث ${selectedOrders.length} طلب بنجاح`, 'success');
      }

      // إعادة تحميل البيانات
      await fetchOrders();
      setSelectedOrders([]);
      setShowBulkStatusModal(false);
    } catch (err: any) {
      showErrorToast('حدث خطأ في العملية الجماعية');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // حذف جماعي
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف ${selectedOrders.length} طلب؟ هذا الإجراء لا يمكن التراجع عنه.`
    );

    if (!confirmed) return;

    setIsBulkOperating(true);
    try {
      const deletePromises = selectedOrders.map(orderId =>
        fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.allSettled(deletePromises);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        showErrorToast(`فشل في حذف ${failures.length} من ${selectedOrders.length} طلب`);
      } else {
        showErrorToast(`تم حذف ${selectedOrders.length} طلب بنجاح`, 'success');
      }

      await fetchOrders();
      setSelectedOrders([]);
    } catch (err: any) {
      showErrorToast('حدث خطأ في الحذف الجماعي');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // تصدير الطلبات المحددة
  const handleBulkExport = () => {
    if (selectedOrders.length === 0) {
      showErrorToast('يرجى تحديد طلبات للتصدير');
      return;
    }
    setIsExportModalOpen(true);
  };

  // فتح وإغلاق modal التصدير
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
  };

  // تحديث حالة الدفع
  const handlePaymentStatusUpdate = async (orderId: string, newPaymentStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // إذا كان هناك خطأ في التوافق، أظهر رسالة مفصلة
        if (responseData.available_payment_statuses) {
          showErrorToast(`${responseData.error}. الخيارات المتاحة: ${responseData.available_payment_statuses.join(', ')}`);
        } else {
          throw new Error(responseData.error || 'فشل في تحديث حالة الدفع');
        }
        return;
      }

      // تحديث الطلب في القائمة المحلية
      setOrders(prevOrders =>
        Array.isArray(prevOrders) ? prevOrders.map(order =>
          order && order.id === orderId ? { ...order, payment_status: newPaymentStatus as any } : order
        ) : []
      );

      // تحديث البيانات من الخادم للتأكد من التطابق (في حالة التحديثات التلقائية)
      setTimeout(() => {
        fetchOrders();
      }, 500);
    } catch (err: any) {
      showErrorToast(err.message || 'حدث خطأ في تحديث حالة الدفع');
    }
  };


  // حساب الطلبات المعروضة حسب الصفحة
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = Array.isArray(filteredOrders) ? filteredOrders.slice(startIndex, endIndex) : [];
  const totalPages = Array.isArray(filteredOrders) ? Math.ceil(filteredOrders.length / itemsPerPage) : 0;

  // إحصائيات متقدمة للطلبات مع البيانات المالية
  const stats = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        replacement_requested: 0,
        replaced: 0,
        returned: 0,
        cancelled: 0,
        financial: {
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          averageOrderValue: 0,
          totalShipping: 0,
          profitableOrders: 0,
          lossOrders: 0
        },
        trends: {
          todayOrders: 0,
          weekOrders: 0,
          monthOrders: 0,
          yesterdayOrders: 0,
          lastWeekOrders: 0,
          lastMonthOrders: 0
        }
      };
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const lastWeekStart = new Date(weekAgo);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const lastMonthStart = new Date(monthAgo);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalShipping = 0;
    let profitableOrders = 0;
    let lossOrders = 0;

    let todayOrders = 0;
    let weekOrders = 0;
    let monthOrders = 0;
    let yesterdayOrders = 0;
    let lastWeekOrders = 0;
    let lastMonthOrders = 0;

    orders.forEach(order => {
      if (!order) return;

      // الحسابات المالية
      totalRevenue += order.total || 0;
      totalCost += order.total_cost || 0;
      totalShipping += order.shipping_cost || 0;

      if (order.total_profit !== undefined) {
        totalProfit += order.total_profit;
        if (order.total_profit > 0) profitableOrders++;
        else if (order.total_profit < 0) lossOrders++;
      }

      // الاتجاهات الزمنية
      const orderDate = new Date(order.created_at);

      if (orderDate >= todayStart) todayOrders++;
      if (orderDate >= weekAgo) weekOrders++;
      if (orderDate >= monthAgo) monthOrders++;

      if (orderDate >= yesterdayStart && orderDate < todayStart) yesterdayOrders++;
      if (orderDate >= lastWeekStart && orderDate < weekAgo) lastWeekOrders++;
      if (orderDate >= lastMonthStart && orderDate < monthAgo) lastMonthOrders++;
    });

    return {
      total: orders.length,
      pending: orders.filter(o => o && o.status === 'pending').length,
      confirmed: orders.filter(o => o && o.status === 'confirmed').length,
      shipped: orders.filter(o => o && o.status === 'shipped').length,
      delivered: orders.filter(o => o && o.status === 'delivered').length,
      replacement_requested: orders.filter(o => o && o.status === 'replacement_requested').length,
      replaced: orders.filter(o => o && o.status === 'replaced').length,
      returned: orders.filter(o => o && o.status === 'returned').length,
      cancelled: orders.filter(o => o && o.status === 'cancelled').length,
      financial: {
        totalRevenue,
        totalCost,
        totalProfit,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        totalShipping,
        profitableOrders,
        lossOrders
      },
      trends: {
        todayOrders,
        weekOrders,
        monthOrders,
        yesterdayOrders,
        lastWeekOrders,
        lastMonthOrders
      }
    };
  }, [orders]);

  // Skeleton rows for loading
  const skeletonRows = Array.from({ length: itemsPerPage }, (_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: 15 }).map((_, j) => (
        <td key={j} className="px-3 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </td>
      ))}
    </tr>
  ));

  return (
    <div className="container mx-auto px-2 md:px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">إدارة الطلبات</h1>
            <p className="text-gray-600">نظام إدارة شامل لجميع طلبات المتجر</p>
          </div>
          <div className="flex items-center gap-3">
            <OrderNotifications
              orders={orders}
              onOrderSelect={handleOpenOrderDetails}
            />
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="mb-6">
          {alerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={cn(
                "mb-3 p-4 rounded-lg border-l-4 flex items-center justify-between",
                alert.type === 'critical' && "bg-red-50 border-red-500",
                alert.type === 'warning' && "bg-yellow-50 border-yellow-500",
                alert.type === 'info' && "bg-blue-50 border-blue-500"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  alert.type === 'critical' && "bg-red-100",
                  alert.type === 'warning' && "bg-yellow-100",
                  alert.type === 'info' && "bg-blue-100"
                )}>
                  {alert.type === 'critical' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : alert.type === 'warning' ? (
                    <Clock className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <Package className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('🔍 عرض الطلبات - Alert ID:', alert.id);
                    
                    // تحديد الحالة المناسبة
                    const newStatus = alert.id === 'pending-orders' ? 'pending' :
                            alert.id === 'replacement-requests' ? 'replacement_requested' :
                            alert.id === 'confirmed-not-shipped' ? 'confirmed' :
                            alert.id === 'long-shipped' ? 'shipped' :
                            alert.id === 'unpaid-delivered' ? 'delivered' : 'all';
                    
                    console.log('✅ تطبيق الفلتر:', newStatus);
                    
                    // حفظ معرف الإشعار النشط
                    setActiveAlertFilter(alert.id);
                    
                    // تطبيق فلتر سريع لإظهار الطلبات المتعلقة بهذا التنبيه
                    setFilters(prev => ({
                      ...prev,
                      search: '',
                      status: newStatus
                    }));
                    
                    // Reset current page
                    setCurrentPage(1);
                    
                    // Scroll إلى الجدول بعد وقت قصير
                    setTimeout(() => {
                      ordersTableRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 100);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors font-medium"
                >
                  عرض الطلبات ({alert.count})
                </button>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  alert.type === 'critical' && "bg-red-100 text-red-800",
                  alert.type === 'warning' && "bg-yellow-100 text-yellow-800",
                  alert.type === 'info' && "bg-blue-100 text-blue-800"
                )}>
                  {alert.count} طلب
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">الإجمالي</p>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">في الانتظار</p>
              <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">مؤكد</p>
              <p className="text-lg font-bold text-blue-600">{stats.confirmed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">تم الشحن</p>
              <p className="text-lg font-bold text-purple-600">{stats.shipped}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">تم التسليم</p>
              <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">استبدال</p>
              <p className="text-lg font-bold text-orange-600">{stats.replacement_requested}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">مرتجع</p>
              <p className="text-lg font-bold text-red-600">{stats.returned}</p>
            </div>
            <X className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">ملغي</p>
              <p className="text-lg font-bold text-gray-600">{stats.cancelled}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Financial Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* الإيرادات الإجمالية */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">إجمالي الإيرادات</h3>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{formatPrice(stats.financial.totalRevenue)}</p>
            <p className="text-xs opacity-80">من {stats.total} طلب</p>
          </div>
        </div>

        {/* إجمالي الربح */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">صافي الربح</h3>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-lg">📈</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{formatPrice(stats.financial.totalProfit)}</p>
            <p className="text-xs opacity-80">
              هامش الربح: {stats.financial.totalRevenue > 0 ?
                ((stats.financial.totalProfit / stats.financial.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* متوسط قيمة الطلب */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">متوسط قيمة الطلب</h3>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{formatPrice(stats.financial.averageOrderValue)}</p>
            <p className="text-xs opacity-80">الطلبات الرابحة: {stats.financial.profitableOrders}</p>
          </div>
        </div>

        {/* الاتجاهات */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">اتجاهات الطلبات</h3>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-lg">📈</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.trends.todayOrders}</p>
            <p className="text-xs opacity-80">
              طلبات اليوم
              {stats.trends.yesterdayOrders > 0 && (
                <span className={`ml-1 ${stats.trends.todayOrders >= stats.trends.yesterdayOrders ? 'text-green-200' : 'text-red-200'}`}>
                  ({stats.trends.todayOrders >= stats.trends.yesterdayOrders ? '+' : ''}{stats.trends.todayOrders - stats.trends.yesterdayOrders})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Trends Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">ملخص الاتجاهات</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.trends.todayOrders}</p>
            <p className="text-sm text-gray-600">اليوم</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.trends.weekOrders}</p>
            <p className="text-sm text-gray-600">هذا الأسبوع</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.trends.monthOrders}</p>
            <p className="text-sm text-gray-600">هذا الشهر</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.trends.yesterdayOrders}</p>
            <p className="text-sm text-gray-600">أمس</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.trends.lastWeekOrders}</p>
            <p className="text-sm text-gray-600">الأسبوع السابق</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.trends.lastMonthOrders}</p>
            <p className="text-sm text-gray-600">الشهر السابق</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedOrderFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        isLoading={loading}
      />

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedOrders.length > 0 ? `${selectedOrders.length} طلب محدد` : `${filteredOrders.length} طلب`}
            </span>
          </div>

          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedOrders([])}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                إلغاء التحديد
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBulkStatusType('order');
                    setShowBulkStatusModal(true);
                  }}
                  disabled={isBulkOperating}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
                >
                  <Edit3 className="w-3 h-3" />
                  تحديث الحالة
                </button>
                <button
                  onClick={() => {
                    setBulkStatusType('payment');
                    setShowBulkStatusModal(true);
                  }}
                  disabled={isBulkOperating}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  تحديث الدفع
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkOperating}
                  className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  حذف
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير
          </button>

          <button
            onClick={handleOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>
      
      {/* مؤشر الفلتر النشط من الإشعارات */}
      {activeAlertFilter && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                يتم عرض الطلبات المفلترة من الإشعار
              </p>
              <p className="text-sm text-blue-700">
                {alerts.find(a => a.id === activeAlertFilter)?.title} - {filteredOrders.length} طلب
              </p>
            </div>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            إلغاء الفلتر
          </button>
        </div>
      )}
      
      <div ref={ordersTableRef} className="bg-white dark:bg-gray-900 rounded-b-xl shadow overflow-x-auto scrollbar-thin border border-gray-100 dark:border-gray-800">
        <table className="min-w-[1300px] divide-y divide-gray-200 dark:divide-gray-800 text-sm">
          <thead>
            <tr>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={handleSelectAllOrders}
                  className="flex items-center justify-center w-full"
                >
                  {selectedOrders.length === currentOrders.length && currentOrders.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">رقم الطلب</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">العميل</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">الهاتف</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">المحافظة</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">العنوان</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">الحالة</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">الدفع</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">التكلفة</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">الربح</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">الإجمالي</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">الشحن</th>

              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 hidden md:table-cell">شركة الشحن</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">تاريخ الإنشاء</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">العمليات</th>
                  </tr>
                </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              skeletonRows
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={15} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  لا توجد طلبات مطابقة
                      </td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => (
                <tr
                  key={order.id}
                  className={cn(
                    idx % 2 === 0
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-gray-50 dark:bg-gray-800',
                    'hover:bg-primary/5 dark:hover:bg-primary/10 transition'
                  )}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSelectOrder(order.id)}
                      className="flex items-center justify-center w-full"
                    >
                      {selectedOrders.includes(order.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-4 font-mono text-xs whitespace-nowrap">{order.order_number}</td>
                  <td className="px-3 py-4 whitespace-nowrap">{order.customer_name}</td>
                  <td className="px-3 py-4 whitespace-nowrap">{order.customer_phone}</td>
                  <td className="px-3 py-4 whitespace-nowrap">{order.governorate || '-'}</td>
                  <td className="px-3 py-4 max-w-xs truncate" title={order.address}>{order.address}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <OrderStatusSelector
                      currentStatus={order.status}
                      orderId={order.id}
                      onStatusChange={handleStatusUpdate}
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <PaymentStatusSelector
                      currentStatus={order.payment_status}
                      orderId={order.id}
                      onStatusChange={handlePaymentStatusUpdate}
                      orderStatus={order.status}
                    />
                  </td>
                  <td className="px-3 py-4 font-mono whitespace-nowrap">
                    <span className="text-orange-600 font-medium">
                      {order.total_cost ? formatPrice(order.total_cost) : '-'}
                    </span>
                  </td>
                  <td className="px-3 py-4 font-mono whitespace-nowrap">
                    {order.total_profit !== undefined ? (
                      <span className={`font-medium ${order.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(order.total_profit)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-4 font-mono whitespace-nowrap">{formatPrice(order.total)}</td>
                  <td className="px-3 py-4 font-mono whitespace-nowrap">{formatPrice(order.shipping_cost)}</td>
                  <td className="px-3 py-4 whitespace-nowrap hidden md:table-cell">{order.shipping_company || '-'}</td>
                  <td className="px-3 py-4 text-xs whitespace-nowrap">{new Date(order.created_at).toLocaleString('en-US')}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenOrderDetails(order.id)}
                      className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                      title="عرض تفاصيل الطلب"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                    </tr>
              ))
            )}
                </tbody>
              </table>
            </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-b-xl border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              عرض {startIndex + 1} إلى {Math.min(endIndex, filteredOrders.length)} من {filteredOrders.length} طلب
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "px-3 py-1 text-sm border rounded-md",
                      pageNum === currentPage
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* Detailed Analytics Section */}
      {!loading && filteredOrders.length > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* نظرة عامة على الأداء */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">نظرة عامة على الأداء</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">معدل التحويل (مؤكد/مجموع)</span>
                <span className="font-bold text-green-600">
                  {stats.total > 0 ? ((stats.confirmed / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">معدل التسليم الناجح</span>
                <span className="font-bold text-blue-600">
                  {stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">معدل الإرجاع</span>
                <span className="font-bold text-red-600">
                  {stats.total > 0 ? (((stats.returned + stats.replacement_requested) / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">متوسط وقت المعالجة</span>
                <span className="font-bold text-purple-600">
                  {((stats.confirmed + stats.shipped + stats.delivered) / Math.max(stats.total, 1) * 2).toFixed(1)} يوم
                </span>
              </div>
            </div>
          </div>

          {/* التحليل المالي */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">التحليل المالي</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي التكلفة</span>
                <span className="font-bold text-orange-600">
                  {formatPrice(stats.financial.totalCost)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تكلفة الشحن</span>
                <span className="font-bold text-blue-600">
                  {formatPrice(stats.financial.totalShipping)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نسبة الطلبات الرابحة</span>
                <span className="font-bold text-green-600">
                  {stats.total > 0 ? ((stats.financial.profitableOrders / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الطلبات الخاسرة</span>
                <span className="font-bold text-red-600">
                  {stats.financial.lossOrders} طلب
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={isOrderDetailsOpen}
        onClose={handleCloseOrderDetails}
        onOrderUpdate={handleOrderUpdate}
      />

      {/* Export/Print Modal */}
      {isExportModalOpen && (
        <ExportPrintOptions
          orders={filteredOrders}
          selectedOrders={selectedOrders}
          onClose={handleCloseExportModal}
        />
      )}

      {/* Bulk Status Update Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {bulkStatusType === 'order' ? 'تحديث حالة الطلبات' : 'تحديث حالة الدفع'}
              </h3>
              <p className="text-gray-600 mb-4">
                سيتم تحديث {selectedOrders.length} طلب
              </p>

              <div className="space-y-2 mb-6">
                {bulkStatusType === 'order' ? (
                  Object.entries(statusLabels).map(([status, label]) => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusUpdate(status)}
                      disabled={isBulkOperating}
                      className="w-full text-right p-3 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[status as OrderStatus]} ml-2`}>
                        {label}
                      </span>
                    </button>
                  ))
                ) : (
                  Object.entries(paymentStatusLabels).map(([status, label]) => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusUpdate(status)}
                      disabled={isBulkOperating}
                      className="w-full text-right p-3 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${paymentStatusColors[status as PaymentStatus]} ml-2`}>
                        {label}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBulkStatusModal(false)}
                  disabled={isBulkOperating}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}