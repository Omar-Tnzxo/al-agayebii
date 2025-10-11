import { useEffect, useRef, useState } from 'react';
import {
  X,
  Copy,
  MessageCircle,
  Printer,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Package,
  ImageIcon,
  CheckCircle,
  XCircle,
  Truck,
  Timer,
  Edit3,
  Save,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { formatOrderId } from '@/lib/utils/helpers';
import { showErrorToast } from '@/lib/utils/show-error-toast';

// واجهات محدثة حسب schema قاعدة البيانات الفعلية
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  quantity: number;
  price: number;
  total_price?: number;
  created_at: string;
  products?: {
    id: string;
    name: string;
    image?: string;
    sku?: string;
    slug?: string;
  };
}

interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  governorate?: string;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'canceled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  total: number;
  shipping_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  shipping_company?: string;
  estimated_delivery?: string;
  actual_delivery_date?: string;
  customer_notes?: string;
  admin_notes?: string;
  shipping_method?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  completed_at?: string;
  order_items: OrderItem[];
}

interface OrderDetailsDrawerProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const ORDER_STATUS: Record<string, { name: string; color: string; icon: any }> = {
  'pending': { name: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  'processing': { name: 'قيد المعالجة', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Timer },
  'shipped': { name: 'تم الشحن', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Truck },
  'completed': { name: 'مكتمل', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  'canceled': { name: 'ملغي', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const PAYMENT_STATUS: Record<string, { name: string; color: string; icon: any }> = {
  'pending': { name: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  'paid': { name: 'مدفوع', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  'failed': { name: 'فشل الدفع', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  'refunded': { name: 'مسترد', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle },
};

// --- سجل تغييرات الحالة ---
interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

function OrderStatusHistorySection({ orderId }: { orderId: string }) {
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetch(`/api/orders/${orderId}/status-history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data?.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("تعذر جلب سجل التغييرات");
        setLoading(false);
      });
  }, [orderId]);

  if (loading) return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    </div>
  );

  if (!history.length) return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="text-center text-gray-500">
        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <span className="text-sm">لا يوجد سجل تغييرات للحالة</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        سجل تغييرات الحالة
      </h3>
      <div className="space-y-3">
        {history.map(h => (
          <div key={h.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {h.old_status && (
                    <>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS[h.old_status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {ORDER_STATUS[h.old_status]?.name || h.old_status}
                      </span>
                      <span className="text-gray-400">←</span>
                    </>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS[h.new_status]?.color || 'bg-gray-100 text-gray-800'}`}>
                    {ORDER_STATUS[h.new_status]?.name || h.new_status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(h.created_at).toLocaleString('ar-EG')}
              </div>
            </div>
            {(h.changed_by || h.notes) && (
              <div className="mt-2 text-sm text-gray-600">
                {h.changed_by && <div>بواسطة: <span className="font-medium">{h.changed_by}</span></div>}
                {h.notes && <div className="mt-1 text-gray-500">ملاحظة: {h.notes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// مكونات مساعدة
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  error,
  disabled = false,
  readonly = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
}) {
  const baseClasses = "w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white";
  const disabledClasses = disabled || readonly ? "bg-gray-100 text-gray-700 cursor-not-allowed" : "";

  // عرض القيمة فقط في وضع القراءة
  if (readonly) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800">
          {type === 'select' ?
            options.find(opt => opt.value === value)?.label || value || 'غير محدد' :
            value || 'غير محدد'
          }
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses} ${disabledClasses}`}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className={`${baseClasses} ${errorClasses} ${disabledClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses} ${disabledClasses}`}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function OrderDetailsDrawer({ order, open, onClose }: OrderDetailsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // حقول موجودة في schema قاعدة البيانات
  const [shippingCompany, setShippingCompany] = useState(order?.shipping_company || "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(order?.estimated_delivery || "");
  const [actualDeliveryDate, setActualDeliveryDate] = useState(order?.actual_delivery_date || "");
  const [shippingMethod, setShippingMethod] = useState(order?.shipping_method || "standard");
  const [status, setStatus] = useState(order?.status || "pending");
  const [paymentStatus, setPaymentStatus] = useState(order?.payment_status || "pending");
  const [shippingCost, setShippingCost] = useState(order?.shipping_cost?.toString() || "0");
  const [taxAmount, setTaxAmount] = useState(order?.tax_amount?.toString() || "0");
  const [discountAmount, setDiscountAmount] = useState(order?.discount_amount?.toString() || "0");
  const [adminNotes, setAdminNotes] = useState(order?.admin_notes || "");

  // حالة الواجهة
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // إغلاق drawer عند الضغط على Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // نسخ رقم الطلب
  function handleCopyOrderId() {
    if (!order) return;
    navigator.clipboard.writeText(formatOrderId(order.id));
    showErrorToast('تم نسخ رقم الطلب');
  }

  // طباعة تفاصيل الطلب
  function handlePrint() {
    window.print();
  }

  // تحديث الحالة عند فتح drawer أو تغيير الطلب
  useEffect(() => {
    setStatus(order?.status || 'pending');
  }, [order, open]);

  // حفظ الحالة الجديدة
  async function handleSaveStatus() {
    if (!order) return;
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        showErrorToast('فشل في تحديث حالة الطلب');
        return;
      }
      if (order) order.status = status;
      // إشعار نجاح (يمكنك استبداله بتوست احترافي)
      showErrorToast('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      showErrorToast('حدث خطأ أثناء تحديث حالة الطلب');
    }
  }

  // تحديد ما إذا كانت هناك تغييرات
  function isChanged() {
    if (!order) return false;
    return (
      shippingCompany !== (order.shipping_company || "") ||
      estimatedDelivery !== (order.estimated_delivery || "") ||
      actualDeliveryDate !== (order.actual_delivery_date || "") ||
      shippingMethod !== (order.shipping_method || "standard") ||
      status !== (order.status || "pending") ||
      paymentStatus !== (order.payment_status || "pending") ||
      shippingCost !== (order.shipping_cost?.toString() || "0") ||
      taxAmount !== (order.tax_amount?.toString() || "0") ||
      discountAmount !== (order.discount_amount?.toString() || "0") ||
      adminNotes !== (order.admin_notes || "")
    );
  }

  // تحقق من صحة البيانات
  function validateFields() {
    const errors: Record<string, string> = {};

    if (parseFloat(shippingCost) < 0) {
      errors.shippingCost = 'تكلفة الشحن يجب أن تكون رقماً موجباً';
    }

    if (parseFloat(taxAmount) < 0) {
      errors.taxAmount = 'الضريبة يجب أن تكون رقماً موجباً';
    }

    if (parseFloat(discountAmount) < 0) {
      errors.discountAmount = 'الخصم يجب أن يكون رقماً موجباً';
    }

    if (shippingCompany && shippingCompany.length > 100) {
      errors.shippingCompany = 'اسم شركة الشحن طويل جداً (100 حرف كحد أقصى)';
    }

    if (adminNotes && adminNotes.length > 500) {
      errors.adminNotes = 'ملاحظات الإدارة طويلة جداً (500 حرف كحد أقصى)';
    }

    return errors;
  }

  // حفظ التعديلات
  async function handleSave() {
    if (!order) return;

    // تحقق من صحة البيانات
    const errors = validateFields();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showErrorToast('يرجى تصحيح الأخطاء قبل الحفظ');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    // إعداد البيانات المتغيرة فقط
    const payload: Record<string, any> = {};

    if (shippingCompany !== (order.shipping_company || "")) payload.shipping_company = shippingCompany;
    if (estimatedDelivery !== (order.estimated_delivery || "")) payload.estimated_delivery = estimatedDelivery;
    if (actualDeliveryDate !== (order.actual_delivery_date || "")) payload.actual_delivery_date = actualDeliveryDate;
    if (shippingMethod !== (order.shipping_method || "standard")) payload.shipping_method = shippingMethod;
    if (status !== (order.status || "pending")) payload.status = status;
    if (paymentStatus !== (order.payment_status || "pending")) payload.payment_status = paymentStatus;
    if (shippingCost !== (order.shipping_cost?.toString() || "0")) payload.shipping_cost = parseFloat(shippingCost);
    if (taxAmount !== (order.tax_amount?.toString() || "0")) payload.tax_amount = parseFloat(taxAmount);
    if (discountAmount !== (order.discount_amount?.toString() || "0")) payload.discount_amount = parseFloat(discountAmount);
    if (adminNotes !== (order.admin_notes || "")) payload.admin_notes = adminNotes;

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'فشل في حفظ التعديلات');
      }

      // تحديث البيانات محلياً
      Object.assign(order, payload);

      setSaveSuccess(true);
      setIsEditing(false);
      showErrorToast('تم حفظ التعديلات بنجاح');

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'حدث خطأ غير متوقع');
      showErrorToast(err.message || 'حدث خطأ أثناء حفظ التعديلات');
      setTimeout(() => setSaveError(""), 3000);
    } finally {
      setIsSaving(false);
    }
  }

  // منع التفاعل مع الخلفية
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // لا تعرض drawer إذا لم يكن مفتوحاً
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300"
        aria-label="إغلاق تفاصيل الطلب"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 transition-all duration-300 transform translate-x-0 flex flex-col"
        tabIndex={0}
        aria-modal="true"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل الطلب</h2>
              {order && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-mono">
                    {formatOrderId(order.id)}
                  </span>
                  <button
                    onClick={handleCopyOrderId}
                    className="p-1 hover:bg-blue-200 rounded transition-colors"
                    title="نسخ رقم الطلب"
                  >
                    <Copy className="w-3 h-3 text-blue-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="طباعة"
            >
              <Printer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8">
          {loadingDetails ? (
            <>
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
            </>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <span>لا توجد بيانات للطلب</span>
            </div>
          ) : (
            <>
              {/* معلومات العميل */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  معلومات العميل
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">اسم العميل</p>
                      <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                      <p className="font-medium text-gray-900 dark:text-white direction-ltr">{order.customer_phone}</p>
                    </div>
                  </div>


                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg mt-1">
                      <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">عنوان التوصيل</p>
                      <p className="font-medium text-gray-900 dark:text-white whitespace-pre-line">{order.address}</p>
                      {order.governorate && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">المحافظة: {order.governorate}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* معلومات الشحن */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    معلومات الشحن
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm">{isEditing ? 'إلغاء' : 'تعديل'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField
                    label="شركة الشحن"
                    value={shippingCompany}
                    onChange={setShippingCompany}
                    error={validationErrors.shippingCompany}
                    readonly={!isEditing}
                  />

                  <EditableField
                    label="طريقة الشحن"
                    value={shippingMethod}
                    onChange={setShippingMethod}
                    type="select"
                    options={[
                      { value: 'standard', label: 'شحن عادي' },
                      { value: 'express', label: 'شحن سريع' }
                    ]}
                    readonly={!isEditing}
                  />

                  <EditableField
                    label="التوصيل المتوقع"
                    value={estimatedDelivery}
                    onChange={setEstimatedDelivery}
                    type="date"
                    readonly={!isEditing}
                  />

                  <EditableField
                    label="تاريخ التسليم الفعلي"
                    value={actualDeliveryDate}
                    onChange={setActualDeliveryDate}
                    type="datetime-local"
                    readonly={!isEditing}
                  />
                </div>
              </div>

              {/* حالة الطلب والدفع */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  حالة الطلب والدفع
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* حالات الطلب */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        {ORDER_STATUS[order.status] && (() => {
                          const IconComponent = ORDER_STATUS[order.status].icon;
                          return <IconComponent className="w-4 h-4" />;
                        })()}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${ORDER_STATUS[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {ORDER_STATUS[order.status]?.name || order.status}
                        </span>
                      </div>
                    </div>

                    <EditableField
                      label="حالة الطلب"
                      value={status}
                      onChange={(value) => setStatus(value as 'pending' | 'processing' | 'shipped' | 'completed' | 'canceled')}
                      type="select"
                      options={[
                        { value: 'pending', label: 'قيد الانتظار' },
                        { value: 'processing', label: 'قيد المعالجة' },
                        { value: 'shipped', label: 'تم الشحن' },
                        { value: 'completed', label: 'مكتمل' },
                        { value: 'canceled', label: 'ملغي' }
                      ]}
                    />
                  </div>

                  {/* حالة الدفع */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        {PAYMENT_STATUS[order.payment_status || 'pending'] && (() => {
                          const IconComponent = PAYMENT_STATUS[order.payment_status || 'pending'].icon;
                          return <IconComponent className="w-4 h-4" />;
                        })()}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${PAYMENT_STATUS[order.payment_status || 'pending']?.color || 'bg-gray-100 text-gray-800'}`}>
                          {PAYMENT_STATUS[order.payment_status || 'pending']?.name || order.payment_status}
                        </span>
                      </div>
                    </div>

                    <EditableField
                      label="حالة الدفع"
                      value={paymentStatus}
                      onChange={(value) => setPaymentStatus(value as 'pending' | 'paid' | 'failed' | 'refunded')}
                      type="select"
                      options={[
                        { value: 'pending', label: 'في الانتظار' },
                        { value: 'paid', label: 'مدفوع' },
                        { value: 'failed', label: 'فشل الدفع' },
                        { value: 'refunded', label: 'مسترد' }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* المبالغ المالية */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  المبالغ المالية
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الطلب</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {order.total.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">طريقة الدفع</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {order.payment_method === 'cash' ? 'الدفع عند الاستلام' :
                       order.payment_method === 'card' ? 'بطاقة ائتمان' :
                       order.payment_method || 'غير محدد'}
                    </p>
                  </div>

                  <EditableField
                    label="تكلفة الشحن (ج.م)"
                    value={shippingCost}
                    onChange={setShippingCost}
                    type="number"
                    error={validationErrors.shippingCost}
                    readonly={!isEditing}
                  />

                  <EditableField
                    label="الضريبة (ج.م)"
                    value={taxAmount}
                    onChange={setTaxAmount}
                    type="number"
                    error={validationErrors.taxAmount}
                    readonly={!isEditing}
                  />

                  <EditableField
                    label="قيمة الخصم (ج.م)"
                    value={discountAmount}
                    onChange={setDiscountAmount}
                    type="number"
                    error={validationErrors.discountAmount}
                    readonly={!isEditing}
                  />
                </div>
              </div>

              {/* الملاحظات */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-slate-600" />
                  الملاحظات
                </h3>

                <div className="space-y-4">
                  <EditableField
                    label="ملاحظات الإدارة"
                    value={adminNotes}
                    onChange={setAdminNotes}
                    type="textarea"
                    error={validationErrors.adminNotes}
                    readonly={!isEditing}
                  />

                  {order.customer_notes && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملاحظات العميل:</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-line">{order.customer_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* عناصر الطلب */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  عناصر الطلب ({order.order_items?.length || 0} عنصر)
                </h3>

                {order.order_items && order.order_items.length > 0 ? (
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          {/* صورة المنتج */}
                          <div className="flex-shrink-0">
                            {(item.product_image || item.products?.image) ? (
                              <img
                                src={item.product_image || item.products?.image}
                                alt={item.product_name || item.products?.name || 'منتج'}
                                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                onError={(e) => { e.currentTarget.src = '/images/product-default.png'; }}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* تفاصيل المنتج */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate mb-2">
                              {item.product_name || item.products?.name || 'منتج غير محدد'}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">الكمية:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">سعر الوحدة:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {item.price.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                                </span>
                              </div>
                              <div className="flex items-center gap-2 col-span-2">
                                <span className="text-gray-500">الإجمالي:</span>
                                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                  {(item.total_price || (item.quantity * item.price)).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* إجمالي الطلب */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">إجمالي الطلب:</span>
                        <span className="text-2xl font-bold">
                          {order.total.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد عناصر في هذا الطلب</p>
                  </div>
                )}
              </div>
              {/* أزرار العمليات */}
              {isChanged() && (
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 -mx-6 -mb-6 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">يوجد تعديلات غير محفوظة</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // إعادة تعيين القيم الأصلية
                          setShippingCompany(order?.shipping_company || "");
                          setEstimatedDelivery(order?.estimated_delivery || "");
                          setActualDeliveryDate(order?.actual_delivery_date || "");
                          setShippingMethod(order?.shipping_method || "standard");
                          setStatus(order?.status || "pending");
                          setPaymentStatus(order?.payment_status || "pending");
                          setShippingCost(order?.shipping_cost?.toString() || "0");
                          setTaxAmount(order?.tax_amount?.toString() || "0");
                          setDiscountAmount(order?.discount_amount?.toString() || "0");
                          setAdminNotes(order?.admin_notes || "");
                          setValidationErrors({});
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        إلغاء التعديلات
                      </button>

                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            حفظ التعديلات
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* رسائل الحالة */}
                  {saveSuccess && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">تم حفظ التعديلات بنجاح</span>
                      </div>
                    </div>
                  )}

                  {saveError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{saveError}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* سجل تغييرات الحالة */}
              {order && <OrderStatusHistorySection orderId={order.id} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsDrawer;