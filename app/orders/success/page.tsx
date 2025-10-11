"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export default function OrderSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const orderCode = params.get("order");
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // جلب تفاصيل الطلب من API
  useEffect(() => {
    async function fetchOrder() {
      if (!orderCode) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?order_number=${orderCode}`);
        if (!res.ok) throw new Error('فشل في جلب تفاصيل الطلب');
        const json = await res.json();
        setOrder(json.data);
      } catch (err) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderCode]);

  const handleCopy = () => {
    if (!orderCode) return;
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    toast.success("تم نسخ كود الطلب!");
  };

  if (!orderCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4 text-center">لم يتم العثور على كود الطلب</h1>
        <a href="/" className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-bold hover:bg-blue-700 transition">العودة للصفحة الرئيسية</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 sm:px-6 py-8 sm:py-12">
      <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-3 sm:mb-4 animate-bounce" />
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 text-center">تم استلام طلبك بنجاح!</h1>
      <p className="text-base sm:text-lg text-gray-700 mb-3 sm:mb-4 text-center">شكراً لثقتك بنا. رقم طلبك هو:</p>
      <div className="flex items-center gap-2 bg-gray-100 px-3 sm:px-4 py-2 rounded-lg mb-4 sm:mb-6">
        <span className="font-mono text-lg sm:text-xl text-blue-700 tracking-widest">{orderCode}</span>
        <button onClick={handleCopy} className="text-blue-600 hover:text-blue-800" aria-label="نسخ كود الطلب">
          <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        {copied && <span className="text-green-600 text-xs ml-2">تم النسخ!</span>}
      </div>
      {/* تفاصيل مختصرة للطلب هنا */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 w-full max-w-2xl mx-auto flex flex-col gap-3 sm:gap-4">
        {loading ? (
          <div className="text-center text-sm sm:text-base text-gray-400">جاري تحميل تفاصيل الطلب...</div>
        ) : order ? (
          <>
            {/* تفاصيل العميل */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 border-b border-blue-100 pb-3 sm:pb-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm text-gray-500">العميل</span>
                <span className="text-sm sm:text-base font-bold text-blue-900">{order.customer_name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm text-gray-500">رقم الهاتف</span>
                <span className="text-sm sm:text-base font-bold text-blue-900">{order.customer_phone}</span>
              </div>
              {order.address && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm text-gray-500">العنوان</span>
                  <span className="text-sm sm:text-base font-bold text-blue-900">{order.address}</span>
                </div>
              )}
            </div>
            {/* تفاصيل المنتجات */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="text-sm sm:text-base font-bold text-blue-700 mb-1">تفاصيل المنتجات</span>
              <div className="flex flex-col gap-2">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100">
                    {item.product_image && (
                      <img src={item.product_image} alt={item.product_name} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200" />
                    )}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-bold text-gray-900">{item.product_name}</span>
                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center text-xs">
                        {item.price_before_discount && item.price_before_discount > item.price ? (
                          <>
                            <span className="line-through text-gray-400">{item.price_before_discount} ج.م</span>
                            <span className="text-red-600 font-bold">خصم {((1 - item.price / item.price_before_discount) * 100).toFixed(0)}%</span>
                            <span className="text-blue-700 font-bold">{item.price} ج.م</span>
                          </>
                        ) : (
                          <span className="text-blue-700 font-bold">{item.price} ج.م</span>
                        )}
                        <span className="text-gray-500">الإجمالي: {(item.price * item.quantity).toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* ملخص الطلب */}
            <div className="flex flex-col gap-2 border-t border-blue-100 pt-3 sm:pt-4">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>سعر الشحن</span>
                <span>{order.shipping_cost == 0 ? <span className="text-green-600 font-bold">مجاني</span> : `${order.shipping_cost} ج.م`}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span>طريقة الدفع</span>
                <span>{order.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-extrabold text-blue-700 mt-2">
                <span>المجموع النهائي</span>
                <span>{order.total} ج.م</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-sm sm:text-base text-red-500">تعذر جلب تفاصيل الطلب</div>
        )}
      </div>
      {/* رسالة تتبع الطلب الاحترافية */}
      <div className="mb-4 sm:mb-6 w-full max-w-md">
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 shadow-sm">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2M12 12v6m0 0l-3-3m3 3l3-3m-6-6V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
          <div className="flex-1">
            <span className="block text-xs sm:text-sm text-blue-900 font-semibold mb-1">
              تتبع حالة طلبك بسهولة!
            </span>
            <span className="block text-xs text-blue-700">
              يمكنك تتبع حالة الطلب من صفحة <a href="/track-order" className="text-blue-600 underline font-bold">تتبع الطلب</a> باستخدام رقم الهاتف أو كود الطلب أعلاه.
            </span>
          </div>
        </div>
      </div>
      <a href="/" className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-bold hover:bg-blue-700 transition">العودة للصفحة الرئيسية</a>
    </div>
  );
} 