'use client';

import { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Package,
  DollarSign,
  Calendar,
  Truck,
  FileText,
  Edit3,
  Save,
  History,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/helpers';
import OrderStatusSelector from './OrderStatusSelector';
import PaymentStatusSelector from './PaymentStatusSelector';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total_price: number;
}

interface StatusHistoryItem {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  governorate?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  shipping_cost: number;
  tax_amount?: number;
  discount_amount?: number;
  shipping_company?: string;
  estimated_delivery?: string;
  actual_delivery_date?: string;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  completed_at?: string;
  shipping_method?: string;
  order_items: OrderItem[];
  total_cost?: number;
  total_profit?: number;
}

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate?: () => void;
}

const statusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  replacement_requested: 'طلب استبدال',
  replaced: 'تم الاستبدال',
  returned: 'مرتجع',
  cancelled: 'ملغي',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  cash_on_delivery: 'دفع عند الاستلام',
  collected: 'تم التحصيل',
  refund_pending: 'في انتظار الإرجاع',
  refunded: 'تم الإرجاع',
};

// ترجمة طريقة الدفع
const paymentMethodLabels: Record<string, string> = {
  cash: 'الدفع نقداً',
  cash_on_delivery: 'الدفع عند الاستلام',
  credit_card: 'بطاقة ائتمان',
  debit_card: 'بطاقة الخصم المباشر',
  bank_transfer: 'تحويل بنكي',
  mobile_payment: 'دفع عبر الهاتف',
  wallet: 'محفظة إلكترونية',
};

// ترجمة طريقة الشحن
const shippingMethodLabels: Record<string, string> = {
  standard: 'شحن عادي',
  express: 'شحن سريع',
  same_day: 'التوصيل في نفس اليوم',
  pickup: 'استلام من الفرع',
  free: 'شحن مجاني',
};

export default function OrderDetailsModal({ orderId, isOpen, onClose, onOrderUpdate }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'history'>('details');
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
      fetchStatusHistory();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrderDetails(data.data);
        setAdminNotes(data.data.admin_notes || '');
      }
    } catch (error) {
      console.error('خطأ في جلب تفاصيل الطلب:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/status-history`);
      const data = await response.json();

      if (data.success) {
        setStatusHistory(data.data || []);
      }
    } catch (error) {
      console.error('خطأ في جلب تاريخ الحالات:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderDetails) return;

    try {
      const response = await fetch(`/api/orders/${orderDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrderDetails(prev => prev ? { ...prev, status: newStatus } : null);
        fetchStatusHistory(); // تحديث التاريخ
        onOrderUpdate?.();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
    }
  };

  const handlePaymentStatusUpdate = async (newPaymentStatus: string) => {
    if (!orderDetails) return;

    try {
      const response = await fetch(`/api/orders/${orderDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });

      if (response.ok) {
        setOrderDetails(prev => prev ? { ...prev, payment_status: newPaymentStatus } : null);
        onOrderUpdate?.();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الدفع:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!orderDetails) return;

    try {
      const response = await fetch(`/api/orders/${orderDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      if (response.ok) {
        setOrderDetails(prev => prev ? { ...prev, admin_notes: adminNotes } : null);
        setEditingNotes(false);
        onOrderUpdate?.();
      }
    } catch (error) {
      console.error('خطأ في حفظ الملاحظات:', error);
    }
  };

  const copyOrderNumber = async () => {
    if (orderDetails?.order_number) {
      await navigator.clipboard.writeText(orderDetails.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 text-white rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">تفاصيل الطلب</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-mono text-blue-600">
                    #{orderDetails?.order_number}
                  </span>
                  <button
                    onClick={copyOrderNumber}
                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                    title="نسخ رقم الطلب"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                'flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                تفاصيل الطلب
              </div>
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={cn(
                'flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                المنتجات ({orderDetails?.order_items?.length || 0})
              </div>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <History className="w-4 h-4" />
                تاريخ الحالات
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : !orderDetails ? (
              <div className="text-center py-12 text-gray-500">
                لا يمكن تحميل تفاصيل الطلب
              </div>
            ) : (
              <>
                {/* تفاصيل الطلب */}
                {activeTab === 'details' && (
                  <div className="space-y-8">
                    {/* معلومات العميل */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">معلومات العميل</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-blue-500" />
                          <div>
                            <span className="text-sm text-gray-500">الاسم الكامل</span>
                            <p className="font-semibold text-gray-900">{orderDetails.customer_name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-green-500" />
                          <div>
                            <span className="text-sm text-gray-500">رقم الهاتف</span>
                            <p className="font-semibold text-gray-900" dir="ltr">{orderDetails.customer_phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 md:col-span-2">
                          <MapPin className="w-5 h-5 text-red-500 mt-1" />
                          <div className="flex-1">
                            <span className="text-sm text-gray-500">العنوان الكامل</span>
                            <p className="font-semibold text-gray-900 leading-relaxed">{orderDetails.address}</p>
                            {orderDetails.governorate && (
                              <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                <span>المحافظة: {orderDetails.governorate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* معلومات الطلب */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* الحالة والدفع */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">الحالة والدفع</h3>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">حالة الطلب</label>
                            <OrderStatusSelector
                              currentStatus={orderDetails.status as any}
                              orderId={orderDetails.id}
                              onStatusChange={handleStatusUpdate}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">حالة الدفع</label>
                            <PaymentStatusSelector
                              currentStatus={orderDetails.payment_status as any}
                              orderId={orderDetails.id}
                              onStatusChange={handlePaymentStatusUpdate}
                              orderStatus={orderDetails.status as any}
                            />
                          </div>

                          <div>
                            <span className="text-sm text-gray-500">طريقة الدفع</span>
                            <p className="font-medium">
                              {paymentMethodLabels[orderDetails.payment_method] || orderDetails.payment_method}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* المبالغ */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل المبالغ</h3>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">المجموع الفرعي</span>
                            <span className="font-medium">{formatPrice(orderDetails.total - orderDetails.shipping_cost)}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-600">تكلفة الشحن</span>
                            <span className="font-medium">{formatPrice(orderDetails.shipping_cost)}</span>
                          </div>

                          {orderDetails.discount_amount && orderDetails.discount_amount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>الخصم</span>
                              <span>-{formatPrice(orderDetails.discount_amount)}</span>
                            </div>
                          )}

                          <div className="border-t pt-3 flex justify-between text-lg font-bold">
                            <span>المجموع الإجمالي</span>
                            <span className="text-blue-600">{formatPrice(orderDetails.total)}</span>
                          </div>

                          {orderDetails.total_cost !== undefined && (
                            <>
                              <div className="flex justify-between text-orange-600">
                                <span>إجمالي التكلفة</span>
                                <span>{formatPrice(orderDetails.total_cost)}</span>
                              </div>

                              {orderDetails.total_profit !== undefined && (
                                <div className={`flex justify-between font-semibold ${orderDetails.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  <span>صافي الربح</span>
                                  <span>{formatPrice(orderDetails.total_profit)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* معلومات الشحن والتواريخ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* الشحن */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">معلومات الشحن</h3>
                        </div>

                        <div className="space-y-3">
                          {orderDetails.shipping_company && (
                            <div>
                              <span className="text-sm text-gray-500">شركة الشحن</span>
                              <p className="font-medium">{orderDetails.shipping_company}</p>
                            </div>
                          )}

                          {orderDetails.shipping_method && (
                            <div>
                              <span className="text-sm text-gray-500">طريقة الشحن</span>
                              <p className="font-medium">
                                {shippingMethodLabels[orderDetails.shipping_method] || orderDetails.shipping_method}
                              </p>
                            </div>
                          )}

                          {orderDetails.estimated_delivery && (
                            <div>
                              <span className="text-sm text-gray-500">التسليم المتوقع</span>
                              <p className="font-medium">{new Date(orderDetails.estimated_delivery).toLocaleDateString('ar-EG')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* التواريخ */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">التواريخ المهمة</h3>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">تاريخ الإنشاء</span>
                            <p className="font-medium">{new Date(orderDetails.created_at).toLocaleDateString('ar-EG')}</p>
                          </div>

                          {orderDetails.shipped_at && (
                            <div>
                              <span className="text-sm text-gray-500">تاريخ الشحن</span>
                              <p className="font-medium">{new Date(orderDetails.shipped_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                          )}

                          {orderDetails.actual_delivery_date && (
                            <div>
                              <span className="text-sm text-gray-500">تاريخ التسليم الفعلي</span>
                              <p className="font-medium">{new Date(orderDetails.actual_delivery_date).toLocaleDateString('ar-EG')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* الملاحظات */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">الملاحظات</h3>
                        <button
                          onClick={() => setEditingNotes(!editingNotes)}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          {editingNotes ? 'إلغاء' : 'تعديل الملاحظات الإدارية'}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {orderDetails.customer_notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 block mb-2">ملاحظات العميل</span>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{orderDetails.customer_notes}</p>
                          </div>
                        )}

                        <div>
                          <span className="text-sm font-medium text-gray-700 block mb-2">الملاحظات الإدارية</span>
                          {editingNotes ? (
                            <div className="space-y-3">
                              <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="أضف ملاحظات إدارية..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveNotes}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                  حفظ
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNotes(false);
                                    setAdminNotes(orderDetails.admin_notes || '');
                                  }}
                                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[80px]">
                              {orderDetails.admin_notes || 'لا توجد ملاحظات إدارية'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* المنتجات */}
                {activeTab === 'items' && (
                  <div className="space-y-4">
                    {orderDetails.order_items?.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                            />
                          )}

                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.product_name}</h4>
                            <p className="text-sm text-gray-500">ID: {item.product_id}</p>
                          </div>

                          <div className="text-center">
                            <span className="text-sm text-gray-500 block">الكمية</span>
                            <span className="text-lg font-semibold text-blue-600">{item.quantity}</span>
                          </div>

                          <div className="text-center">
                            <span className="text-sm text-gray-500 block">السعر</span>
                            <span className="text-lg font-semibold">{formatPrice(item.price)}</span>
                          </div>

                          <div className="text-center">
                            <span className="text-sm text-gray-500 block">الإجمالي</span>
                            <span className="text-lg font-bold text-green-600">{formatPrice(item.total_price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* تاريخ الحالات */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {statusHistory.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        لا يوجد تاريخ للحالات
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {statusHistory.map((item, index) => (
                          <div key={item.id} className="relative">
                            {index !== statusHistory.length - 1 && (
                              <div className="absolute right-6 top-12 bottom-0 w-px bg-gray-200"></div>
                            )}

                            <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-6">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <History className="w-5 h-5 text-blue-600" />
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {item.old_status && (
                                    <>
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                                        {statusLabels[item.old_status] || item.old_status}
                                      </span>
                                      <span className="text-gray-400">←</span>
                                    </>
                                  )}
                                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm font-medium">
                                    {statusLabels[item.new_status] || item.new_status}
                                  </span>
                                </div>

                                {/* رسالة الانتقال المترجمة */}
                                {item.old_status && (
                                  <p className="text-sm text-gray-700 mb-2 bg-blue-50 px-3 py-2 rounded border border-blue-100">
                                    تم تحديث الحالة من <span className="font-semibold text-blue-700">{statusLabels[item.old_status] || item.old_status}</span> إلى <span className="font-semibold text-blue-700">{statusLabels[item.new_status] || item.new_status}</span>
                                  </p>
                                )}

                                <p className="text-sm text-gray-600 mb-2">
                                  {new Date(item.created_at).toLocaleString('ar-EG', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>

                                {item.changed_by && (
                                  <p className="text-sm text-gray-500">
                                    بواسطة: {item.changed_by}
                                  </p>
                                )}

                                {item.notes && !item.notes.includes('تم تحديث الحالة من') && (
                                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}