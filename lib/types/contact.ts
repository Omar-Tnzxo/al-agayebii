/**
 * أنواع بيانات صفحة الاتصال
 */

export interface ContactInfo {
  // معلومات أساسية
  companyName: string;
  tagline: string;
  description: string;
  
  // معلومات الاتصال
  primaryPhone: string;
  secondaryPhone?: string;
  whatsappNumber: string;
  primaryEmail: string;
  salesEmail?: string;
  supportEmail?: string;
  
  // العنوان
  fullAddress: string;
  city: string;
  governorate: string;
  postalCode?: string;
  landmark?: string;
  
  // ساعات العمل
  workingDays: string;
  workingHours: string;
  weekendStatus: string;
  
  // وسائل التواصل الاجتماعي
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  
  // معلومات إضافية
  shippingInfo: string;
  paymentMethods: string;
  warrantyInfo: string;
  
  // إعدادات الخريطة
  googleMapsUrl?: string;
  mapLatitude?: string;
  mapLongitude?: string;
  showMap: boolean;
  
  // إعدادات النموذج
  enableContactForm: boolean;
  formSubmissionEmail: string;
  formSuccessMessage: string;
  formErrorMessage: string;
  
  // FAQ
  enableFaq: boolean;
  faqItems?: FAQItem[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  inquiryType: string;
  company?: string;
  message: string;
  attachment?: File;
}

export interface ContactSettings {
  [key: string]: string;
}

// أنواع الاستفسارات
export const INQUIRY_TYPES = [
  { value: 'general', label: 'استفسار عام' },
  { value: 'sales', label: 'استفسار مبيعات' },
  { value: 'support', label: 'دعم فني' },
  { value: 'complaint', label: 'شكوى' },
  { value: 'suggestion', label: 'اقتراح' },
  { value: 'partnership', label: 'شراكة تجارية' },
] as const;

export type InquiryType = typeof INQUIRY_TYPES[number]['value'];