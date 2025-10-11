import type { ContactInfo, ContactSettings } from '@/lib/types/contact';

/**
 * تحويل إعدادات قاعدة البيانات إلى كائن معلومات الاتصال
 */
export function parseContactSettings(settings: ContactSettings): ContactInfo {
  return {
    // معلومات أساسية
    companyName: settings.contact_company_name || 'متجر العجايبي',
    tagline: settings.contact_tagline || 'متجرك الموثوق للأدوات الكهربائية والصحية',
    description: settings.contact_description || 'نحن نقدم أفضل الأدوات والمعدات بأعلى جودة وأفضل الأسعار',
    
    // معلومات الاتصال
    primaryPhone: settings.contact_primary_phone || '',
    secondaryPhone: settings.contact_secondary_phone || undefined,
    whatsappNumber: settings.contact_whatsapp || '',
    primaryEmail: settings.contact_primary_email || '',
    salesEmail: settings.contact_sales_email || undefined,
    supportEmail: settings.contact_support_email || undefined,
    
    // العنوان
    fullAddress: settings.contact_full_address || 'الجيزه 6 اكتوبر ابني بيتك المرحلة السادسة',
    city: settings.contact_city || '6 أكتوبر',
    governorate: settings.contact_governorate || 'الجيزة',
    postalCode: settings.contact_postal_code || undefined,
    landmark: settings.contact_landmark || undefined,
    
    // ساعات العمل
    workingDays: settings.contact_working_days || 'السبت - الخميس',
    workingHours: settings.contact_working_hours || '9:00 صباحاً - 9:00 مساءً',
    weekendStatus: settings.contact_weekend_status || 'مغلق يوم الجمعة',
    
    // وسائل التواصل الاجتماعي
    facebookUrl: settings.contact_facebook_url || undefined,
    instagramUrl: settings.contact_instagram_url || undefined,
    tiktokUrl: settings.contact_tiktok_url || undefined,
    youtubeUrl: settings.contact_youtube_url || undefined,
    
    // معلومات إضافية
    shippingInfo: settings.contact_shipping_info || 'التوصيل لجميع أنحاء الجمهورية',
    paymentMethods: settings.contact_payment_methods || 'كاش عند الاستلام - تحويل بنكي - فودافون كاش',
    warrantyInfo: settings.contact_warranty_info || 'ضمان على جميع المنتجات حسب نوع المنتج',
    
    // إعدادات الخريطة
    googleMapsUrl: settings.contact_google_maps_url || undefined,
    mapLatitude: settings.contact_map_latitude || undefined,
    mapLongitude: settings.contact_map_longitude || undefined,
    showMap: settings.contact_show_map === 'true',
    
    // إعدادات النموذج
    enableContactForm: settings.contact_enable_form !== 'false',
    formSubmissionEmail: settings.contact_form_email || '',
    formSuccessMessage: settings.contact_form_success_message || 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
    formErrorMessage: settings.contact_form_error_message || 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.',
    
    // FAQ
    enableFaq: settings.contact_enable_faq === 'true',
    faqItems: [], // سيتم جلبها من جدول منفصل لاحقاً
  };
}

/**
 * إعدادات افتراضية لصفحة الاتصال
 */
export function getDefaultContactSettings(): ContactSettings {
  return {
    // معلومات أساسية
    contact_company_name: 'متجر العجايبي',
    contact_tagline: 'متجرك الموثوق للأدوات الكهربائية والصحية',
    contact_description: 'نحن نقدم أفضل الأدوات والمعدات بأعلى جودة وأفضل الأسعار. تسوق الآن واحصل على أفضل العروض والخدمات.',
    
    // معلومات الاتصال (فارغة - يجب ملؤها من لوحة التحكم)
    contact_primary_phone: '',
    contact_secondary_phone: '',
    contact_whatsapp: '',
    contact_primary_email: '',
    contact_sales_email: '',
    contact_support_email: '',
    
    // العنوان
    contact_full_address: 'الجيزه 6 اكتوبر ابني بيتك المرحلة السادسة',
    contact_city: '6 أكتوبر',
    contact_governorate: 'الجيزة',
    contact_postal_code: '',
    contact_landmark: '',
    
    // ساعات العمل
    contact_working_days: 'السبت - الخميس',
    contact_working_hours: '9:00 صباحاً - 9:00 مساءً',
    contact_weekend_status: 'مغلق يوم الجمعة',
    
    // وسائل التواصل الاجتماعي
    contact_facebook_url: '',
    contact_instagram_url: '',
    contact_tiktok_url: '',
    contact_youtube_url: '',
    
    // معلومات إضافية
    contact_shipping_info: 'التوصيل لجميع أنحاء الجمهورية',
    contact_payment_methods: 'كاش عند الاستلام - تحويل بنكي - فودافون كاش',
    contact_warranty_info: 'ضمان على جميع المنتجات حسب نوع المنتج',
    
    // إعدادات الخريطة
    contact_google_maps_url: '',
    contact_map_latitude: '',
    contact_map_longitude: '',
    contact_show_map: 'false',
    
    // إعدادات النموذج
    contact_enable_form: 'true',
    contact_form_email: '',
    contact_form_success_message: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
    contact_form_error_message: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.',
    
    // FAQ
    contact_enable_faq: 'false',
  };
}

/**
 * التحقق من صحة رقم الهاتف المصري
 */
export function validateEgyptianPhone(phone: string): boolean {
  // رقم مصري يبدأ بـ +20 أو 01
  const egyptianPhoneRegex = /^(\+20|20)?01[0125][0-9]{8}$/;
  return egyptianPhoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // إزالة المسافات والرموز
  const cleanPhone = phone.replace(/\s|-|\+/g, '');
  
  // إذا كان يبدأ بـ 20، أضف +
  if (cleanPhone.startsWith('20')) {
    return `+${cleanPhone}`;
  }
  
  // إذا كان يبدأ بـ 01، أضف +20
  if (cleanPhone.startsWith('01')) {
    return `+20${cleanPhone}`;
  }
  
  return phone;
}

/**
 * تنسيق البريد الإلكتروني للعرض
 */
export function formatEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * إنشاء رابط واتساب
 */
export function createWhatsAppLink(phone: string, message: string = 'مرحباً، أريد الاستفسار عن منتجاتكم'): string {
  const cleanPhone = phone.replace(/\s|-|\+/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * إنشاء رابط الخرائط
 */
export function createMapsLink(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}