'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TruckIcon, 
  Timer,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  CreditCard,
  AlertTriangle,
  Printer,
  MessageCircle,
  Edit3,
  Save,
  X,
  ImageIcon,
  Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatOrderId, formatProductId, formatPrice, createWhatsAppLink, formatOrderStatus } from '@/lib/utils/helpers';
import { handleApiResponse } from '@/lib/utils/handle-api-response';
import { showErrorToast } from '@/lib/utils/show-error-toast';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';

// حالات الطلبات
const ORDER_STATUS = {
  'pending': { 
    name: 'قيد الانتظار', 
    color: 'bg-amber-100 text-amber-800', 
    icon: Clock 
  },
  'processing': {
    name: 'قيد المعالجة',
    color: 'bg-blue-100 text-blue-800',
    icon: Timer
  },
  'shipped': {
    name: 'تم الشحن',
    color: 'bg-indigo-100 text-indigo-800',
    icon: TruckIcon
  },
  'completed': {
    name: 'مكتمل',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  'canceled': {
    name: 'ملغي',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
};

// نموذج منتج في الطلب - محدث
interface OrderProduct {
  id: string;
  name: string;
  image?: string;
  price: number;
  sku?: string;
  slug?: string;
}

// نموذج عنصر في الطلب - محدث
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: OrderProduct;
  products?: OrderProduct;
}

// نموذج الطلب للواجهة - محدث
interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: keyof typeof ORDER_STATUS;
  order_items: OrderItem[];
  total: number;
  payment_method: string;
  created_at: string;
  address: string;
  notes?: string;
  // tracking_number تم إزالته نهائياً
  items_count: number;
  updated_at: string;
}

interface OrderDetailsClientProps {
  initialOrder: Order | null;
  orderId: string;
}

export default function OrderDetailsClient({ initialOrder, orderId }: OrderDetailsClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof ORDER_STATUS>('pending');
  
  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  useEffect(() => {
    // إذا لم يتم تمرير الطلب الأولي، قم بجلبه
    if (!initialOrder) {
      const fetchOrder = async () => {
        if (!orderId) return;
        
        try {
          const { data, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items(
                *,
                products:product_id(id, name, image, sku, slug)
              )
            `)
            .eq('id', orderId)
            .single();
            
          if (error) {
            console.error('Error fetching order:', error);
            showErrorToast('حدث خطأ أثناء جلب بيانات الطلب');
          }
          
          if (data) {
            setOrder(data as unknown as Order);
          } else {
            console.error("لم يتم العثور على الطلب");
            router.push('/dashboard/orders');
          }
        } catch (error) {
          console.error('Error fetching order:', error);
          showErrorToast('حدث خطأ أثناء جلب بيانات الطلب');
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [initialOrder, orderId, router]);

  // دعم التحديث الفوري realtime
  useSupabaseRealtime({
    table: 'orders',
    event: '*',
    onChange: () => {
      if (orderId) {
        // إعادة جلب بيانات الطلب عند أي تغيير
        fetch(`/api/orders/${orderId}`).then(r => r.ok && r.json()).then(result => {
          if (result && result.success && result.data) {
            setOrder(result.data);
          }
        });
      }
    },
  });

  // معالجة تغيير حالة الطلب - محدث
  const handleStatusChange = async (newStatus: keyof typeof ORDER_STATUS) => {
    if (!order) return;
    
    setStatusUpdateLoading(true);
    try {
      const { error } = await handleApiResponse<any>(
        fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: order.id, status: newStatus }),
        })
      );

      if (error) {
        showErrorToast(error);
        return;
      }
      
      // تحديث حالة الطلب محليًا
      setOrder(prevOrder => prevOrder ? { ...prevOrder, status: newStatus, updated_at: new Date().toISOString() } : null);
      setIsEditingStatus(false);
      
      showErrorToast(`تم تغيير حالة الطلب إلى: ${ORDER_STATUS[newStatus].name}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      showErrorToast('حدث خطأ أثناء تحديث حالة الطلب');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // فتح واتساب مع رسالة مخصصة
  const openWhatsApp = () => {
    if (!order) return;
    
    const itemsList = order.order_items
      .map(item => `• ${item.product?.name || item.products?.name || `منتج ${formatProductId(item.product_id)}`} (الكمية: ${item.quantity})`)
      .join('\n');
    
    const message = `مرحباً ${order.customer_name}،\n\n` +
      `بخصوص طلبك رقم ${formatOrderId(order.id)}:\n` +
      `تاريخ الطلب: ${new Date(order.created_at).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })}\n\n` +
      `المنتجات المطلوبة:\n${itemsList}\n\n` +
      `المبلغ الإجمالي: ${formatPrice(order.total)} \n` +
      `الحالة الحالية: ${ORDER_STATUS[order.status]?.name}\n` +
      `طريقة الدفع: ${order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 
                     order.payment_method === 'card' ? 'بطاقة ائتمان' : 
                     order.payment_method || 'غير محدد'}\n\n` +
      `كيف يمكننا مساعدتك؟`;

    const whatsappUrl = createWhatsAppLink(order.customer_phone, message);
    window.open(whatsappUrl, '_blank');
  };

  // تنسيق السعر بالجنيه المصري
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // إظهار حالة التحميل
  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg text-gray-600">جاري تحميل بيانات الطلب...</p>
      </div>
    );
  }

  // إذا لم يتم العثور على الطلب
  if (!order) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">لم يتم العثور على الطلب</h2>
        <p className="text-gray-600 mb-4">لا يمكن العثور على الطلب المطلوب</p>
        <Link
          href="/dashboard/orders"
          className="text-primary hover:underline flex items-center gap-1"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          العودة إلى قائمة الطلبات
        </Link>
      </div>
    );
  }

  const StatusIcon = ORDER_STATUS[order.status]?.icon || Clock;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/orders" 
            className="text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              طلب {formatOrderId(order.id)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              تم الإنشاء في {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* زر الواتساب */}
          <button
            onClick={openWhatsApp}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            إرسال واتساب
          </button>
          
          {/* زر الطباعة */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            طباعة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بيانات الطلب الأساسية */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              بيانات العميل
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-500">اسم العميل</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.customer_phone}</p>
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                </div>
              </div>

              {order.customer_email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.customer_email}</p>
                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mt-1">
                  <MapPin className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 whitespace-pre-line">{order.address}</p>
                  <p className="text-sm text-gray-500">عنوان التسليم</p>
                </div>
              </div>
            </div>
          </div>

          {/* حالة الطلب */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <StatusIcon className="h-5 w-5 text-primary" />
              حالة الطلب
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon className="h-6 w-6" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS[order.status]?.color}`}>
                    {ORDER_STATUS[order.status]?.name}
                  </span>
                </div>
                
                {!isEditingStatus ? (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className="text-primary hover:text-primary-dark p-2 hover:bg-primary/10 rounded-full transition-colors"
                    title="تعديل الحالة"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingStatus(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="إلغاء"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {isEditingStatus && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">تغيير حالة الطلب:</p>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as keyof typeof ORDER_STATUS)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {Object.entries(ORDER_STATUS).map(([key, { name }]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedStatus)}
                      disabled={statusUpdateLoading || selectedStatus === order.status}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {statusUpdateLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      حفظ التغيير
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>تاريخ الإنشاء: {new Date(order.created_at).toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>آخر تحديث: {new Date(order.updated_at).toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>طريقة الدفع: {
                    order.payment_method === 'cash' ? 'الدفع عند الاستلام' :
                    order.payment_method === 'card' ? 'بطاقة ائتمان' :
                    order.payment_method || 'غير محدد'
                  }</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* عناصر الطلب */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              عناصر الطلب ({order.order_items?.length || 0} منتج)
            </h2>
            
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* صورة المنتج */}
                    <div className="flex-shrink-0">
                      {(item.product?.image || item.products?.image) ? (
                        <img 
                          src={item.product?.image || item.products?.image}
                          alt={item.product?.name || item.products?.name || 'منتج'}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/product-default.png';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* تفاصيل المنتج */}
                    <div className="flex-1">
                      <h3 className="font-medium text-lg text-gray-900">
                        {item.product?.name || item.products?.name || `منتج ${formatProductId(item.product_id)}`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        رقم المنتج: {item.product?.sku || item.products?.sku || item.product?.slug || item.products?.slug}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>الكمية: {item.quantity}</span>
                        <span>•</span>
                        <span>سعر الوحدة: {formatPrice(item.price)} </span>
                      </div>
                    </div>
                    
                    {/* إجمالي المنتج */}
                    <div className="text-left">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.quantity * item.price)} 
                      </p>
                      <p className="text-sm text-gray-500">
                        الإجمالي
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* إجمالي الطلب */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg">
                    <span className="text-xl font-bold text-gray-900">المجموع الكلي:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(order.total)} 
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">لا توجد عناصر في هذا الطلب</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 