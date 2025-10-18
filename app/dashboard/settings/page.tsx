'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, Upload, Check, AlertTriangle, Info, Settings, Globe, Palette, Store, CreditCard, User, Shield, Truck, ToggleLeft, ToggleRight, MapPin, Star } from 'lucide-react';
import { useSiteSettings } from '@/app/components/SiteSettingsProvider';
import Image from 'next/image';
import Link from 'next/link';

// ثوابت سياسة الإرجاع
const RETURN_POLICY_UNITS = [
  { value: 'يوم', label: 'يوم' },
  { value: 'أيام', label: 'أيام' },
  { value: 'شهر', label: 'شهر' },
  { value: 'شهور', label: 'شهور' },
  { value: 'سنة', label: 'سنة' },
  { value: 'سنوات', label: 'سنوات' },
];

// مكون الحاوية الرئيسية للقسم
const SettingsSection = ({ 
  icon: Icon, 
  title, 
  description, 
  children, 
  className = "" 
}: {
  icon: any;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// مكون حقل الإدخال المحسن
const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  description,
  required = false,
  rows = 3,
  className = ""
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    <label htmlFor={name} className="block text-sm font-medium text-gray-800">
      {label} {required && <span className="text-red-500 text-xs">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        suppressHydrationWarning={true}
        className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      />
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        suppressHydrationWarning={true}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
        className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      />
    )}
    {description && (
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    )}
  </div>
);

// مكون رفع الملفات المحسن
const FileUpload = ({ 
  label, 
  description, 
  currentFile, 
  onUpload, 
  isUploading, 
  accept, 
  preview = true 
}: {
  label: string;
  description?: string;
  currentFile?: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  accept: string;
  preview?: boolean;
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-2">{label}</label>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
    </div>
    
    {currentFile && preview && (
      <div className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-200">
        <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-200">
          <Image src={currentFile} alt="معاينة" fill className="object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">الملف الحالي</p>
          <p className="text-xs text-gray-500">تم رفعه بنجاح</p>
        </div>
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-green-600" />
        </div>
      </div>
    )}
    
    <div className="relative">
      <input
        type="file"
        accept={accept}
        onChange={onUpload}
        disabled={isUploading}
        className="sr-only"
        id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
      />
      <label
        htmlFor={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
        className={`
          flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${isUploading 
            ? 'border-primary/50 bg-primary/5 cursor-not-allowed' 
            : 'border-gray-300 bg-gray-50/50 hover:border-primary hover:bg-primary/5'
          }
        `}
      >
        {isUploading ? (
          <div className="flex items-center gap-2 text-primary">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">جاري الرفع...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-600">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">اختيار ملف</span>
          </div>
        )}
      </label>
    </div>
  </div>
);

// مكون التنبيه
const Alert = ({ type, children }: { type: 'success' | 'error' | 'info', children: React.ReactNode }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const icons = {
    success: Check,
    error: AlertTriangle,
    info: Info
  };
  
  const Icon = icons[type];
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type]}`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

// مكون المنبثقة
const Popup = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* خلفية معتمة */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* المنبثقة */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {children}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  // حالة إعدادات الموقع
  const defaultSettings: Record<string, string> = {
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    whatsappNumber: '',
    logoUrl: '',
    faviconUrl: '',
    currencySymbol: '',
    taxRate: '',
    shipping_cost: '',
    free_shipping_threshold: '',
    freeShippingEnabled: 'true',
    returnPolicyValue: '',
    returnPolicyUnit: 'يوم',
    qualityGuaranteeText: '',
    // Simplified shipping settings
    shipping_enabled: 'true',
    shipping_company_name: 'شركة الشحن الرئيسية',
    shipping_cost_type: 'fixed',
    shipping_min_days: '1',
    shipping_max_days: '3',
    pickup_enabled: 'false',
    shipping_phone_message: 'سيتم تحديد تكلفة الشحن عند التواصل معك هاتفياً',
    // Reviews settings
    reviews_enabled: 'true',
  };

  const [settings, setSettings] = useState<Record<string, string>>(defaultSettings);
  const { setSettings: updateGlobalSettings } = useSiteSettings();

  // حالة النموذج
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [shippingSystemEnabled, setShippingSystemEnabled] = useState(true);
  const [shippingSystemLoading, setShippingSystemLoading] = useState(false);
  const [shippingCompaniesCount, setShippingCompaniesCount] = useState(0);
  
  // جلب الإعدادات من API عند التحميل
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success) {
          setSettings(json.data);
        }
      } catch (err) {
        console.error('خطأ فى جلب الإعدادات:', err);
      }
    }
    
    // تأخير قليل للتأكد من اكتمال Hydration
    const timer = setTimeout(() => {
    fetchSettings();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // جلب إعدادات نظام شركات الشحن وعدد الشركات
  useEffect(() => {
    async function fetchShippingSystemSettings() {
      try {
        const res = await fetch('/api/settings/shipping-system');
        const json = await res.json();
        console.log('إعدادات نظام شركات الشحن المحملة:', json); // للتأكد من البيانات
        if (json.success) {
          const enabled = json.data.shipping_companies_enabled;
          console.log('حالة النظام المحملة:', enabled); // للتأكد من القيمة
          setShippingSystemEnabled(enabled);
        }
      } catch (err) {
        console.error('خطأ في جلب إعدادات نظام شركات الشحن:', err);
      }
    }
    
    // جلب عدد شركات الشحن النشطة
    async function fetchShippingCompaniesCount() {
      try {
        const res = await fetch('/api/shipping-companies');
        const json = await res.json();
        if (json.success) {
          // حساب عدد الشركات النشطة فقط
          const activeCompanies = json.data.filter((company: any) => company.is_active);
          setShippingCompaniesCount(activeCompanies.length);
        }
      } catch (err) {
        console.error('خطأ في جلب عدد شركات الشحن:', err);
      }
    }
    
    // تأخير قليل للتأكد من اكتمال Hydration
    const timer = setTimeout(() => {
      fetchShippingSystemSettings();
      fetchShippingCompaniesCount();
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);

  // تحديث حالة نظام شركات الشحن من الإعدادات العامة
  useEffect(() => {
    if (settings.shipping_companies_enabled !== undefined) {
      const enabled = settings.shipping_companies_enabled === 'true';
      setShippingSystemEnabled(enabled);
      
      // تحديث عدد الشركات إذا كان النظام مفعل
      if (enabled && shippingCompaniesCount === 0) {
        async function updateCompaniesCount() {
          try {
            const res = await fetch('/api/shipping-companies');
            const json = await res.json();
            if (json.success) {
              const activeCompanies = json.data.filter((company: any) => company.is_active);
              setShippingCompaniesCount(activeCompanies.length);
            }
          } catch (err) {
            console.error('خطأ في تحديث عدد الشركات:', err);
          }
        }
        updateCompaniesCount();
      }
    }
  }, [settings.shipping_companies_enabled, shippingCompaniesCount]);
  
  // معالج تغيير الإعدادات
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    
    if (success) {
      setSuccess(false);
    }
  };

  // معالج رفع الشعار
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('نوع الملف غير مدعوم. الأنواع المقبولة: JPEG, PNG, WebP, SVG');
      return;
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`حجم الملف كبير جداً. الحد الأقصى ${MAX_SIZE_MB}MB`);
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('originalSize', file.size.toString());
      formData.append('isCompressed', 'false');
      formData.append('compressionQuality', '100');

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'فشل في رفع الشعار');
      }

      const url = json.data?.url || json.url;
      if (url) {
        setSettings((prev) => ({ ...prev, logoUrl: url }));
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('فشل في رفع الشعار');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/x-icon', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      alert('صيغة الأيقونة غير مدعومة. استخدم PNG، SVG أو ICO');
      return;
    }

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`الحجم الأقصى للأيقونة ${MAX_SIZE_MB}MB`);
      return;
    }

    setFaviconUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload/favicon', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'فشل في رفع الأيقونة');

      const url = json.data?.url || json.url;
      setSettings(prev => ({ ...prev, faviconUrl: url }));
    } catch (err) {
      console.error(err);
      alert('فشل في رفع الأيقونة');
    } finally {
      setFaviconUploading(false);
    }
  };
  
  // معالج إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      // إضافة حالة نظام شركات الشحن إلى الإعدادات
      const settingsWithShipping = {
        ...settings,
        shipping_companies_enabled: shippingSystemEnabled ? 'true' : 'false'
      };
      
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsWithShipping),
      });
      if (!res.ok) throw new Error('فشل في حفظ الإعدادات');
      
      updateGlobalSettings(settingsWithShipping);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // معالج تغيير سياسة الإرجاع
  const handleReturnPolicyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    if (success) setSuccess(false);
  };

  // معالج تبديل نظام شركات الشحن
  const handleShippingSystemToggle = async () => {
    setShippingSystemLoading(true);
    try {
      const newStatus = !shippingSystemEnabled;
      console.log('تبديل حالة النظام إلى:', newStatus); // للتأكد من القيمة
      
      // تحديث الإعدادات المحلية أولاً
      setSettings(prev => ({
        ...prev,
        shipping_companies_enabled: newStatus ? 'true' : 'false'
      }));
      
      const requestBody = {
        shipping_companies_enabled: newStatus,
        default_shipping_cost: parseFloat(settings.shipping_cost || '25'),
        default_free_shipping_threshold: parseFloat(settings.free_shipping_threshold || '500')
      };
      
      console.log('بيانات الطلب:', requestBody); // للتأكد من البيانات المرسلة
      
      const res = await fetch('/api/settings/shipping-system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();
      console.log('استجابة الخادم:', json); // للتأكد من الاستجابة
      
      if (json.success) {
        setShippingSystemEnabled(newStatus);
        setSuccess(true);
        
        // تحديث عدد الشركات إذا تم تفعيل النظام
        if (newStatus) {
          try {
            const companiesRes = await fetch('/api/shipping-companies');
            const companiesJson = await companiesRes.json();
            if (companiesJson.success) {
              const activeCompanies = companiesJson.data.filter((company: any) => company.is_active);
              setShippingCompaniesCount(activeCompanies.length);
            }
          } catch (err) {
            console.error('خطأ في تحديث عدد الشركات:', err);
          }
        }
        
        // تحديث الكاش المحلي
        if (typeof window !== 'undefined') {
          localStorage.setItem('alagayebi_shipping_system_settings', JSON.stringify({
            shipping_companies_enabled: newStatus,
            default_shipping_cost: parseFloat(settings.shipping_cost || '25'),
            default_free_shipping_threshold: parseFloat(settings.free_shipping_threshold || '500')
          }));
        }
        
        setTimeout(() => setSuccess(false), 5000);
      } else {
        throw new Error(json.error || 'فشل في تحديث إعدادات نظام شركات الشحن');
      }
    } catch (error) {
      console.error('خطأ في تحديث نظام شركات الشحن:', error);
      alert('فشل في تحديث إعدادات نظام شركات الشحن');
    } finally {
      setShippingSystemLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                إعدادات الموقع
              </h1>
              <p className="text-gray-600">
                قم بتخصيص وإدارة إعدادات موقعك الإلكتروني بشكل شامل
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Settings className="w-4 h-4" />
              لوحة التحكم
            </div>
          </div>
        </div>

        {/* Success Popup */}
        <Popup isOpen={success} onClose={() => setSuccess(false)}>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              تم حفظ جميع الإعدادات بنجاح!
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              سيتم تطبيق جميع التغييرات تلقائياً على الموقع
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              حسناً
            </button>
          </div>
        </Popup>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Brand & Identity Section */}
          <SettingsSection
            icon={Palette}
            title="الهوية البصرية والعلامة التجارية"
            description="قم بتخصيص شعار موقعك وأيقونة المتصفح لتعكس هويتك التجارية"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FormField
                  label="اسم الموقع"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  placeholder="متجر العجايبي"
                  description="الاسم الذي سيظهر في عنوان المتصفح وأجزاء مختلفة من الموقع"
                  required
                />
                
                <FormField
                  label="وصف الموقع"
                  name="siteDescription"
                  type="textarea"
                  value={settings.siteDescription}
                  onChange={handleChange}
                  placeholder="وصف مختصر وجذاب لموقعك الإلكتروني..."
                  description="وصف مختصر للموقع يساعد في تحسين محركات البحث"
                  rows={4}
                />
              </div>
              
              <div className="space-y-6">
                <FileUpload
                  label="شعار الموقع"
                  description="الحد الأقصى 5MB. الصيغ المدعومة: PNG, JPG, SVG"
                  currentFile={settings.logoUrl}
                  onUpload={handleLogoUpload}
                  isUploading={logoUploading}
                  accept="image/*"
                />
                
                <FileUpload
                  label="أيقونة المتصفح (Favicon)"
                  description="الحد الأقصى 2MB. الصيغ المدعومة: PNG, ICO, SVG"
                  currentFile={settings.faviconUrl}
                  onUpload={handleFaviconUpload}
                  isUploading={faviconUploading}
                  accept="image/png,image/x-icon,image/svg+xml"
                />
              </div>
            </div>
          </SettingsSection>

          {/* Contact Information */}
          <SettingsSection
            icon={User}
            title="معلومات التواصل"
            description="أضف طرق التواصل المختلفة ليتمكن العملاء من الوصول إليك بسهولة"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="البريد الإلكتروني"
                name="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={handleChange}
                placeholder="info@example.com"
                description="البريد الإلكتروني الرسمي للمتجر"
              />
              
              <FormField
                label="رقم الهاتف"
                name="contactPhone"
                value={settings.contactPhone}
                onChange={handleChange}
                placeholder="+966 50 123 4567"
                description="رقم الهاتف للتواصل المباشر"
              />
              
              <FormField
                label="رقم الواتساب"
                name="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={handleChange}
                placeholder="+966501234567"
                description="رقم الواتساب للدعم الفني (بدون مسافات)"
              />
            </div>
          </SettingsSection>

          {/* Social Media */}
          <SettingsSection
            icon={Globe}
            title="روابط التواصل الاجتماعي"
            description="أضف روابط حساباتك على منصات التواصل الاجتماعي"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                label="Facebook"
                name="facebookUrl"
                value={settings.facebookUrl}
                onChange={handleChange}
                placeholder="https://facebook.com/yourpage"
                description="رابط صفحة الفيسبوك"
              />
              
              <FormField
                label="Instagram"
                name="instagramUrl"
                value={settings.instagramUrl}
                onChange={handleChange}
                placeholder="https://instagram.com/youraccount"
                description="رابط حساب الإنستجرام"
              />
              
              <FormField
                label="TikTok"
                name="tiktokUrl"
                value={settings.tiktokUrl}
                onChange={handleChange}
                placeholder="https://tiktok.com/@youraccount"
                description="رابط حساب التيك توك"
              />
            </div>
          </SettingsSection>

          {/* Simplified Shipping Settings */}
          <SettingsSection
            icon={Truck}
            title="إعدادات الشحن"
            description="إدارة خيارات الشحن والاستلام من الفروع"
          >
            <div className="space-y-6">
              {/* Enable/Disable Shipping */}
              <div className="flex items-center justify-between p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">تفعيل نظام الشحن</h4>
                  <p className="text-xs text-gray-600">عند التعطيل، سيكون خيار "الاستلام من الفرع" فقط متاحاً</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.shipping_enabled === 'true'}
                    onChange={(e) => setSettings(prev => ({ ...prev, shipping_enabled: e.target.checked ? 'true' : 'false' }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-primary transition-colors"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                </label>
              </div>

              {/* Shipping Company Name */}
              <FormField
                label="اسم شركة الشحن"
                name="shipping_company_name"
                value={settings.shipping_company_name || ''}
                onChange={handleChange}
                placeholder="شركة الشحن الرئيسية"
                description="الاسم الذي سيظهر للعملاء"
              />

              {/* Delivery Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="مدة التوصيل من (أيام)"
                  name="shipping_min_days"
                  type="number"
                  value={settings.shipping_min_days || ''}
                  onChange={handleChange}
                  placeholder="1"
                  description="الحد الأدنى لمدة التوصيل"
                />
                <FormField
                  label="مدة التوصيل إلى (أيام)"
                  name="shipping_max_days"
                  type="number"
                  value={settings.shipping_max_days || ''}
                  onChange={handleChange}
                  placeholder="3"
                  description="الحد الأقصى لمدة التوصيل"
                />
              </div>

              {/* Shipping Cost Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-800">نوع تكلفة الشحن</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: settings.shipping_cost_type === 'fixed' ? 'var(--primary)' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="shipping_cost_type"
                      value="fixed"
                      checked={settings.shipping_cost_type === 'fixed'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">سعر ثابت</span>
                      <p className="text-xs text-gray-500">تحديد سعر شحن موحد لجميع الطلبات</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: settings.shipping_cost_type === 'phone' ? 'var(--primary)' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="shipping_cost_type"
                      value="phone"
                      checked={settings.shipping_cost_type === 'phone'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">يتم تحديده هاتفياً</span>
                      <p className="text-xs text-gray-500">سيتم التواصل مع العميل لتحديد تكلفة الشحن</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Shipping Cost - Show only if fixed price */}
              {settings.shipping_cost_type === 'fixed' && (
                <FormField
                  label="تكلفة الشحن (ج.م)"
                  name="shipping_cost"
                  type="number"
                  value={settings.shipping_cost || ''}
                  onChange={handleChange}
                  placeholder="30"
                  description="التكلفة الثابتة للشحن"
                />
              )}

              {/* Phone Message - Show only if phone determination */}
              {settings.shipping_cost_type === 'phone' && (
                <FormField
                  label="رسالة التحديد الهاتفي"
                  name="shipping_phone_message"
                  type="textarea"
                  value={settings.shipping_phone_message || ''}
                  onChange={handleChange}
                  placeholder="سيتم تحديد تكلفة الشحن عند التواصل معك هاتفياً"
                  description="الرسالة التي ستظهر للعميل"
                  rows={2}
                />
              )}

              {/* Enable/Disable Pickup from Branch */}
              <div className="flex items-center justify-between p-5 bg-green-50/50 rounded-xl border border-green-100">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    تفعيل الاستلام من الفرع
                  </h4>
                  <p className="text-xs text-gray-600">السماح للعملاء باختيار الاستلام من أحد الفروع</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pickup_enabled === 'true'}
                    onChange={(e) => setSettings(prev => ({ ...prev, pickup_enabled: e.target.checked ? 'true' : 'false' }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-600 transition-colors"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                </label>
              </div>

              {/* Link to Branches Management */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">إدارة الفروع</h4>
                    <p className="text-xs text-gray-600">إضافة وتعديل وحذف فروع الاستلام المتاحة للعملاء</p>
                  </div>
                  <Link
                    href="/dashboard/branches"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    إدارة الفروع
                  </Link>
                </div>
              </div>

              {/* Info Alert */}
              <Alert type="info">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">ملاحظات هامة:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>عند تعطيل الشحن، سيظهر للعملاء خيار "الاستلام من الفرع" فقط</li>
                    <li>يمكن تفعيل كلا الخيارين (الشحن والاستلام من الفرع) معاً</li>
                    <li>الشحن المجاني يطبق تلقائياً عند تجاوز الحد المحدد في حالة السعر الثابت</li>
                  </ul>
                </div>
              </Alert>
            </div>
          </SettingsSection>

          {/* E-commerce Settings */}
          <SettingsSection
            icon={Store}
            title="إعدادات المتجر الإلكتروني"
            description="إعدادات خاصة بالتجارة الإلكترونية والمدفوعات"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                label="رمز العملة"
                name="currencySymbol"
                value={settings.currencySymbol}
                onChange={handleChange}
                placeholder="ج.م"
                description="الرمز المختصر للعملة"
              />
              
              <FormField
                label="نسبة الضريبة (%)"
                name="taxRate"
                type="number"
                value={settings.taxRate}
                onChange={handleChange}
                placeholder="15"
                description="نسبة ضريبة القيمة المضافة"
              />
              
              <FormField
                label="تكلفة الشحن (ج.م)"
                name="shipping_cost"
                type="number"
                value={settings.shipping_cost}
                onChange={handleChange}
                placeholder="25"
                description="تكلفة الشحن الافتراضية"
              />

              <FormField
                label="الحد الأدنى للشحن المجاني"
                name="free_shipping_threshold"
                type="number"
                value={settings.free_shipping_threshold}
                onChange={handleChange}
                placeholder="500"
                description="قيمة الطلب للحصول على شحن مجاني"
              />
            </div>
            {/* qualityGuaranteeText field */}
            <div className="mt-6">
              <FormField
                label="نص ضمان الجودة"
                name="qualityGuaranteeText"
                type="text"
                value={settings.qualityGuaranteeText || ''}
                onChange={handleChange}
                placeholder="ضمان منتج عالي الجودة"
                description="النص الذي سيظهر بجانب أيقونة الضمان في صفحة المنتج"
                required
              />
            </div>

            {/* Toggle Free Shipping Enabled */}
            <div className="mt-6">
              <label htmlFor="freeShippingEnabled" className="flex items-center gap-4 cursor-pointer select-none">
                <span className="text-sm font-medium text-gray-800">تفعيل الشحن المجاني</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="freeShippingEnabled"
                    name="freeShippingEnabled"
                    checked={settings.freeShippingEnabled === 'true'}
                    onChange={(e) => setSettings(prev => ({ ...prev, freeShippingEnabled: e.target.checked ? 'true' : 'false' }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-primary transition-colors"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">عند التعطيل سيتم احتساب تكلفة الشحن على جميع الطلبات.</p>
            </div>

            {/* Return Policy Section */}
            <div className="mt-8">
              <h4 className="text-base font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                سياسة الإرجاع
              </h4>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <input
                  type="number"
                  min={1}
                  name="returnPolicyValue"
                  value={settings.returnPolicyValue || ''}
                  onChange={handleReturnPolicyChange}
                  className="w-32 rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="عدد الأيام/الشهور/السنوات"
                  aria-label="عدد الأيام/الشهور/السنوات"
                />
                <select
                  name="returnPolicyUnit"
                  value={settings.returnPolicyUnit || 'يوم'}
                  onChange={handleReturnPolicyChange}
                  className="w-32 rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  aria-label="وحدة المدة"
                >
                  {RETURN_POLICY_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">مثال: 14 يوم، 30 يوم، 1 شهر ...</span>
              </div>
            </div>
          </SettingsSection>

          {/* Reviews Settings Section */}
          <SettingsSection
            icon={Star}
            title="إعدادات التقييمات"
            description="التحكم في نظام تقييمات العملاء للمنتجات"
          >
            {/* Toggle Reviews Enabled */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">تفعيل نظام التقييمات</h4>
                <p className="text-xs text-gray-600">السماح للعملاء بإضافة تقييماتهم على المنتجات</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reviews_enabled === 'true'}
                  onChange={(e) => setSettings(prev => ({ ...prev, reviews_enabled: e.target.checked ? 'true' : 'false' }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-amber-500 transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </label>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">ملاحظة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>عند تعطيل التقييمات، لن يظهر قسم التقييمات في صفحات المنتجات</li>
                    <li>التقييمات الموجودة ستبقى في قاعدة البيانات ولن تُحذف</li>
                    <li>يمكنك إدارة التقييمات من <Link href="/dashboard/reviews" className="text-blue-600 underline hover:text-blue-700">صفحة إدارة التقييمات</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              جميع التغييرات سيتم حفظها وتطبيقها فوراً على الموقع
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`
                flex items-center gap-3 px-8 py-4 rounded-xl font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ جميع الإعدادات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 