'use client';

import { useState } from 'react';
import {
  Search,
  Phone,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Calendar,
  CreditCard,
  MapPin,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Copy,
  Download,
  Eye,
  ShoppingBag,
  Star,
  RefreshCw,
  FileText,
  Box
} from 'lucide-react';
import { formatOrderId, formatProductId, formatPrice } from '@/lib/utils/helpers';
import { handleApiResponse } from '@/lib/utils/handle-api-response';
import SafeImage from '../components/SafeImage';

// واجهة الطلب المحدثة
interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  status: string;
  status_arabic: string;
  total_amount: number;
  payment_method: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  completed_at?: string;
  // tracking_number تم إزالته نهائياً
  shipping_company?: string;
  estimated_delivery?: string;
  items_count: number;
  order_items: any[];
  status_history?: any[];
}

// واجهة استجابة API
interface TrackResponse {
  success: boolean;
  search_value: string;
  search_type: string;
  orders_count: number;
  orders: Order[];
}

export default function TrackOrderPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType] = useState<'order'>('order'); // إزالة خيار البحث برقم الهاتف
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // تتبع الطلبات
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('يرجى إدخال رقم الطلب');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrders([]);
    setHasSearched(true);

    try {
      const { data, error } = await handleApiResponse<TrackResponse>(
        fetch(`/api/track-order?order=${encodeURIComponent(searchTerm.trim())}`)
      );

      if (error) {
        setError(error);
        return;
      }

      setOrders(data?.orders || []);
    } catch (err: any) {
      console.error('خطأ في تتبع الطلبات:', err);
      setError('حدث خطأ أثناء البحث عن الطلبات');
    } finally {
      setIsLoading(false);
    }
  };

  // تنسيق السعر بطريقة ذكية (أرقام إنجليزية)
  const formatCurrency = (price: number) => {
    // التحقق من أن القيمة رقم صحيح
    if (Number.isInteger(price)) {
      return price.toLocaleString('en-US') + ' ج.م';
    }
    
    // إذا كان عشري، نعرض رقمين عشريين فقط
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ج.م';
  };

  // نسخ النص للحافظة
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`تم نسخ ${label} بنجاح`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'replacement_requested':
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
      case 'replaced':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'returned':
        return <ArrowRight className="h-5 w-5 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  // الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'replacement_requested':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'replaced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'returned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // الحصول على النص العربي للحالة
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'confirmed': 'مؤكد',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'replacement_requested': 'طلب استبدال',
      'replaced': 'تم الاستبدال',
      'returned': 'تم الإرجاع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  };

  // الحصول على النص العربي لحالة الدفع
  const getPaymentStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'معلق',
      'cash_on_delivery': 'دفع عند الاستلام',
      'collected': 'تم التحصيل',
      'refund_pending': 'استرداد معلق',
      'refunded': 'تم الاسترداد'
    };
    return statusMap[status] || status;
  };

  // مكون تتبع التقدم
  const OrderProgressTracker = ({ order }: { order: Order }) => {
    const steps = [
      { key: 'pending', label: 'قيد الانتظار', icon: Clock },
      { key: 'confirmed', label: 'مؤكد', icon: CheckCircle },
      { key: 'shipped', label: 'تم الشحن', icon: Truck },
      { key: 'delivered', label: 'تم التسليم', icon: CheckCircle }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === order.status);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Package className="h-5 w-5" />
          تتبع الطلب
        </h3>

        <div className="relative">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center relative">
                  {/* الخط المتصل */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-4 right-10 w-full h-0.5 ${
                        index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                      style={{ width: '100%', right: '50%', transform: 'translateX(50%)' }}
                    />
                  )}

                  {/* الأيقونة */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 relative z-10 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* التسمية */}
                  <span
                    className={`text-xs mt-2 text-center ${
                      isCompleted || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {order.shipped_at && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-500" />
                <span className="text-gray-600">تاريخ الشحن:</span>
                <span className="font-medium">{formatDate(order.shipped_at)}</span>
              </div>
            )}
            {order.estimated_delivery && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">التسليم المتوقع:</span>
                <span className="font-medium">{formatDate(order.estimated_delivery)}</span>
              </div>
            )}
            {order.completed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">تاريخ التسليم:</span>
                <span className="font-medium">{formatDate(order.completed_at)}</span>
              </div>
            )}
            {order.shipping_company && (
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600">شركة الشحن:</span>
                <span className="font-medium">{order.shipping_company}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const displayOrderDetails = (order: any) => (
    <div className="space-y-6">
      {/* تتبع التقدم */}
      <OrderProgressTracker order={order} />

      {/* معلومات الطلب الأساسية */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تفاصيل الطلب
          </h3>
          <button
            onClick={() => copyToClipboard(order.order_number || order.id, 'رقم الطلب')}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
          >
            <Copy className="h-4 w-4" />
            نسخ رقم الطلب
          </button>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* معلومات العميل */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              معلومات العميل
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <span className="text-gray-600 text-sm">الاسم</span>
                  <p className="font-medium">{order.customer_name || 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <span className="text-gray-600 text-sm">الهاتف</span>
                  <p className="font-medium">{order.customer_phone || 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <span className="text-gray-600 text-sm">العنوان</span>
                  <p className="text-sm text-gray-700">
                    {order.address || order.shipping_address || 'غير محدد'}
                  </p>
                  {order.governorate && (
                    <p className="text-sm text-gray-500">{order.governorate}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الطلب */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              معلومات الطلب
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <span className="text-gray-600 text-sm">تاريخ الطلب</span>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1">{getStatusIcon(order.status)}</div>
                <div>
                  <span className="text-gray-600 text-sm">حالة الطلب</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <span className="text-gray-600 text-sm">طريقة الدفع</span>
                  <p className="font-medium">{order.payment_method}</p>
                  {order.payment_status && (
                    <p className="text-sm text-gray-500">{getPaymentStatusText(order.payment_status)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* الملخص المالي */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              الملخص المالي
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">المجموع الفرعي:</span>
                <span className="font-medium">{formatCurrency(order.total - (order.shipping_cost || 0) - (order.tax_amount || 0) + (order.discount_amount || 0))}</span>
              </div>
              {order.shipping_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">رسوم الشحن:</span>
                  <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">الضريبة:</span>
                  <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>الخصم:</span>
                  <span className="font-medium">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">المجموع النهائي:</span>
                  <span className="font-bold text-primary">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* عناصر الطلب */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-lg border-b pb-2 mb-6 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            عناصر الطلب ({order.order_items.length} عنصر)
          </h4>
          <div className="space-y-4">
            {order.order_items.map((item: any, index: number) => {
              // أولوية الحصول على البيانات: product object > item direct properties > fallback
              const productImage = item.product?.image || item.product_image || '/images/product-default.png';
              const productName = item.product?.name || item.product_name || `منتج ${formatProductId(item.product_id)}`;
              const productSku = item.product?.sku || item.product_sku;
              const itemPrice = item.price || item.unit_price || 0;
              const itemTotalPrice = item.total_price || (itemPrice * item.quantity);
              
              return (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {/* صورة المنتج */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                    <SafeImage
                      src={productImage}
                      alt={productName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      fallbackSrc="/images/product-default.png"
                    />
                  </div>

                  {/* معلومات المنتج */}
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">
                      {productName}
                    </h5>
                    {productSku && (
                      <p className="text-sm text-gray-500 mb-2">
                        رقم المنتج: {productSku}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>الكمية: {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        <span>السعر: {formatCurrency(itemPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* السعر الإجمالي */}
                  <div className="text-left flex-shrink-0">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(itemTotalPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* تاريخ الحالات */}
      {order.status_history && order.status_history.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-lg border-b pb-2 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            تاريخ تحديثات الطلب
          </h4>
          <div className="space-y-4">
            {order.status_history.map((history: any, index: number) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      {history.old_status ? `${getStatusText(history.old_status)} ← ` : ''}{getStatusText(history.new_status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(history.created_at)}
                    </span>
                  </div>
                  {history.notes && (
                    <p className="text-sm text-gray-600">{history.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">تتبع طلبك</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            أدخل رقم طلبك لتتبع حالة الطلب ومعرفة تفاصيل الشحن
          </p>
        </div>

        {/* نموذج البحث */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleTrackOrder} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-900 mb-6">
                أدخل رقم الطلب
              </label>

              <div className="relative">
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Package className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ORD-2024-001"
                  className="w-full pl-4 pr-12 py-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">
                أدخل رقم الطلب الذي حصلت عليه عند التأكيد (مثال: ORD-2024-001)
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>جاري البحث...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>تتبع الطلبات</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">عذراً، حدث خطأ</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* النتائج */}
        {hasSearched && !isLoading && !error && orders.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">لا توجد طلبات</h3>
            <p className="text-gray-600 text-lg mb-6">
              لم يتم العثور على طلبات مرتبطة برقم الطلب هذا
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              <h4 className="font-medium mb-2">نصائح للبحث:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• تأكد من إدخال الرقم بشكل صحيح</li>
                <li>• تأكد من أن الطلب تم تأكيده</li>
                <li>• جرب البحث بطريقة أخرى</li>
              </ul>
            </div>
          </div>
        )}

        {/* قائمة الطلبات */}
        {orders.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                طلباتك ({orders.length} {orders.length === 1 ? 'طلب' : 'طلبات'})
              </h2>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full">
                <Package className="h-4 w-4" />
                <span className="font-medium">
                  رقم الطلب: {searchTerm}
                </span>
              </div>
            </div>

            <div className="space-y-8">
              {orders.map((order, index) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                  {/* رأس الطلب */}
                  <div className="bg-gradient-to-l from-primary/5 to-primary/10 px-8 py-6 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-primary">#{index + 1}</span>
                          <h3 className="text-xl font-bold text-gray-900">
                            {order.order_number || `طلب ${order.id.substring(0, 8).toUpperCase()}`}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>تاريخ الطلب: {formatDate(order.created_at)}</span>
                          </div>
                          {order.updated_at !== order.created_at && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>آخر تحديث: {formatDate(order.updated_at)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            <span>{order.items_count} عنصر</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-4">
                        <div className="text-left">
                          <p className="text-sm text-gray-600 mb-1">المجموع</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* تفاصيل الطلب */}
                  <div className="p-8">
                    {displayOrderDetails(order)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 