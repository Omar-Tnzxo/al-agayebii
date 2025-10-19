'use client';

import { useState, useEffect } from 'react';
import {
  Truck, DollarSign, Clock, Save, RefreshCw, Package, Phone,
  CheckCircle, XCircle, AlertCircle, MapPin
} from 'lucide-react';
import { clearShippingCache } from '@/lib/store/shipping';

interface ShippingSettings {
  shipping_enabled: string;
  shipping_company_name: string;
  shipping_cost: string;
  shipping_cost_type: string;
  shipping_min_days: string;
  shipping_max_days: string;
  free_shipping_threshold: string;
  pickup_enabled: string;
  shipping_phone_message: string;
}

export default function ShippingSettingsPage() {
  const [settings, setSettings] = useState<ShippingSettings>({
    shipping_enabled: 'true',
    shipping_company_name: '',
    shipping_cost: '30',
    shipping_cost_type: 'fixed',
    shipping_min_days: '1',
    shipping_max_days: '3',
    free_shipping_threshold: '500',
    pickup_enabled: 'true',
    shipping_phone_message: 'سيتم تحديد تكلفة الشحن عند التواصل معك'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const result = await response.json();

      if (result.success && result.data) {
        setSettings({
          shipping_enabled: result.data.shipping_enabled || 'true',
          shipping_company_name: result.data.shipping_company_name || '',
          shipping_cost: result.data.shipping_cost || '30',
          shipping_cost_type: result.data.shipping_cost_type || 'fixed',
          shipping_min_days: result.data.shipping_min_days || '1',
          shipping_max_days: result.data.shipping_max_days || '3',
          free_shipping_threshold: result.data.free_shipping_threshold || '500',
          pickup_enabled: result.data.pickup_enabled || 'true',
          shipping_phone_message: result.data.shipping_phone_message || 'سيتم تحديد تكلفة الشحن عند التواصل معك'
        });
      }
    } catch (error) {
      console.error('خطأ في جلب الإعدادات:', error);
      showMessage('error', 'فشل في جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // مسح كاش الشحن عند حفظ الإعدادات
        clearShippingCache();
        showMessage('success', 'تم حفظ الإعدادات بنجاح');
        // إعادة تحميل الصفحة بعد ثانية لتحديث جميع البيانات
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showMessage('error', result.error || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      showMessage('error', 'خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isShippingEnabled = settings.shipping_enabled === 'true';
  const isPickupEnabled = settings.pickup_enabled === 'true';
  const costType = settings.shipping_cost_type;

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-2">إعدادات الشحن والتوصيل</h1>
            <p className="text-sm sm:text-base text-gray-600">إدارة نظام الشحن والاستلام من الفرع</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={fetchSettings}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex-1 sm:flex-initial"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  <span className="hidden sm:inline">جاري الحفظ...</span>
                  <span className="sm:hidden">حفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* رسالة النجاح/الخطأ */}
        {message && (
          <div className={`p-3 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-3 text-sm sm:text-base ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            )}
            <span className="break-words">{message.text}</span>
          </div>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* قسم تفعيل الشحن */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">نظام الشحن</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4">تفعيل أو تعطيل خدمة التوصيل للمنزل</p>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isShippingEnabled}
                    onChange={(e) => setSettings({ ...settings, shipping_enabled: e.target.checked ? 'true' : 'false' })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {isShippingEnabled ? 'الشحن مفعّل' : 'الشحن معطّل'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* إعدادات الشحن - تظهر فقط إذا كان الشحن مفعّل */}
        {isShippingEnabled && (
          <>
            {/* معلومات شركة الشحن */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">معلومات شركة الشحن</h2>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  اسم شركة الشحن
                </label>
                <input
                  type="text"
                  value={settings.shipping_company_name}
                  onChange={(e) => setSettings({ ...settings, shipping_company_name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="مثال: شركة الشحن السريع"
                />
              </div>
            </div>

            {/* تكلفة الشحن */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">تكلفة الشحن</h2>
                  <p className="text-sm sm:text-base text-gray-600">حدد طريقة احتساب تكلفة الشحن</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* اختيار نوع التكلفة */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">نوع التكلفة</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      costType === 'fixed' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="cost_type"
                        value="fixed"
                        checked={costType === 'fixed'}
                        onChange={() => setSettings({ ...settings, shipping_cost_type: 'fixed' })}
                        className="w-4 h-4 text-primary flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base">سعر ثابت</div>
                        <div className="text-xs text-gray-500">تحديد سعر محدد للشحن</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      costType === 'phone' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="cost_type"
                        value="phone"
                        checked={costType === 'phone'}
                        onChange={() => setSettings({ ...settings, shipping_cost_type: 'phone' })}
                        className="w-4 h-4 text-primary flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base">يحدد هاتفياً</div>
                        <div className="text-xs text-gray-500">يتم الاتفاق على السعر</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* حقل السعر الثابت */}
                {costType === 'fixed' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      تكلفة الشحن (جنيه مصري)
                    </label>
                    <input
                      type="number"
                      value={settings.shipping_cost}
                      onChange={(e) => setSettings({ ...settings, shipping_cost: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="30"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                {/* رسالة "يحدد هاتفياً" */}
                {costType === 'phone' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      رسالة للعميل
                    </label>
                    <textarea
                      value={settings.shipping_phone_message}
                      onChange={(e) => setSettings({ ...settings, shipping_phone_message: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      rows={3}
                      placeholder="سيتم تحديد تكلفة الشحن عند التواصل معك"
                    />
                  </div>
                )}

                {/* حد الشحن المجاني */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    حد الشحن المجاني (جنيه مصري)
                  </label>
                  <input
                    type="number"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="500"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    سيكون الشحن مجانياً عند تجاوز هذا المبلغ. ضع 0 لتعطيل الشحن المجاني.
                  </p>
                </div>
              </div>
            </div>

            {/* مدة التوصيل */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">مدة التوصيل</h2>
                  <p className="text-sm sm:text-base text-gray-600">حدد المدة المتوقعة للتوصيل</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    الحد الأدنى (أيام)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping_min_days}
                    onChange={(e) => setSettings({ ...settings, shipping_min_days: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    الحد الأقصى (أيام)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping_max_days}
                    onChange={(e) => setSettings({ ...settings, shipping_max_days: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min="1"
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">
                  <strong>سيتم عرض:</strong> التوصيل خلال {settings.shipping_min_days}-{settings.shipping_max_days} أيام
                </p>
              </div>
            </div>
          </>
        )}

        {/* قسم الاستلام من الفرع */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">الاستلام من الفرع</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4">السماح للعملاء باستلام الطلبات من الفروع مباشرة</p>

              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isPickupEnabled}
                    onChange={(e) => setSettings({ ...settings, pickup_enabled: e.target.checked ? 'true' : 'false' })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {isPickupEnabled ? 'الاستلام من الفرع مفعّل' : 'الاستلام من الفرع معطّل'}
                </span>
              </label>

              {isPickupEnabled && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs sm:text-sm text-orange-800 break-words">
                    💡 تأكد من إضافة فروعك من صفحة <a href="/dashboard/branches" className="underline font-medium">إدارة الفروع</a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ملخص الإعدادات */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 sm:p-6">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-4">📋 ملخص الإعدادات الحالية</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              {isShippingEnabled ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span className="break-words">الشحن: <strong>{isShippingEnabled ? 'مفعّل' : 'معطّل'}</strong></span>
            </div>

            {isShippingEnabled && (
              <>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="break-words">التكلفة: <strong>
                    {costType === 'fixed' ? `${settings.shipping_cost} ج.م` : 'يحدد هاتفياً'}
                  </strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="break-words">الشحن المجاني: <strong>عند {settings.free_shipping_threshold} ج.م</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="whitespace-nowrap">المدة: <strong>{settings.shipping_min_days}-{settings.shipping_max_days} أيام</strong></span>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              {isPickupEnabled ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span className="break-words">الاستلام من الفرع: <strong>{isPickupEnabled ? 'متاح' : 'غير متاح'}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
