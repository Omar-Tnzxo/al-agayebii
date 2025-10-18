'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  Send, 
  MapPin, 
  MessageSquare, 
  Clock,
  User,
  Building,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Headphones,
  ShoppingBag,
  Truck,
  Award,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ContactInfo, ContactFormData, InquiryType } from '@/lib/types/contact';
import { INQUIRY_TYPES } from '@/lib/types/contact';
import { formatPhone, createWhatsAppLink, createMapsLink } from '@/lib/utils/contact';
import { ContactFAQ } from '@/app/components/contact/ContactFAQ';

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    inquiryType: 'general',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // جلب معلومات الاتصال
  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await fetch('/api/contact');
      const result = await response.json();
      
      if (result.success) {
        setContactInfo(result.data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitResult({
          type: 'success',
          message: result.message || 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          inquiryType: 'general',
          company: '',
          message: '',
        });
      } else {
        setSubmitResult({
          type: 'error',
          message: result.error || 'حدث خطأ أثناء إرسال الرسالة.',
        });
      }
    } catch (error) {
      setSubmitResult({
        type: 'error',
        message: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contactInfo) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-600 mb-2">خطأ في تحميل البيانات</h1>
        <p className="text-gray-500">تعذر تحميل معلومات الاتصال. يرجى المحاولة مرة أخرى.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative py-20 bg-gradient-to-r from-primary to-primary/90"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center text-white">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              تواصل معنا
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl mb-2 text-primary-100"
            >
              {contactInfo.tagline}
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg max-w-2xl mx-auto text-primary-200"
            >
              {contactInfo.description}
            </motion.p>
          </div>
        </div>
      </motion.section>

      <div className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* معلومات الاتصال */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* معلومات أساسية */}
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-primary">معلومات الاتصال</h2>
              </div>
              
              <div className="space-y-4">
                {contactInfo.primaryPhone && (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500">الهاتف الأساسي</p>
                      <a 
                        href={`tel:${contactInfo.primaryPhone}`}
                        className="font-semibold text-primary hover:text-primary/80 transition-colors"
                        dir="ltr"
                      >
                        {formatPhone(contactInfo.primaryPhone)}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.whatsappNumber && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">واتساب</p>
                      <a 
                        href={createWhatsAppLink(contactInfo.whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1"
                        dir="ltr"
                      >
                        {formatPhone(contactInfo.whatsappNumber)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.primaryEmail && (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                      <a 
                        href={`mailto:${contactInfo.primaryEmail}`}
                        className="font-semibold text-primary hover:text-primary/80 transition-colors"
                        dir="ltr"
                      >
                        {contactInfo.primaryEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* العنوان وساعات العمل */}
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-primary">العنوان وساعات العمل</h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">العنوان</p>
                  <p className="font-semibold text-primary mb-2">{contactInfo.fullAddress}</p>
                  <p className="text-gray-600">{contactInfo.city}, {contactInfo.governorate}</p>
                  {contactInfo.landmark && (
                    <p className="text-sm text-gray-500 mt-1">📍 {contactInfo.landmark}</p>
                  )}
                  <a 
                    href={createMapsLink(contactInfo.fullAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm mt-2"
                  >
                    احصل على الاتجاهات
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <p className="text-sm text-gray-500">ساعات العمل</p>
                  </div>
                  <p className="font-semibold text-accent">{contactInfo.workingDays}</p>
                  <p className="text-gray-600">{contactInfo.workingHours}</p>
                  <p className="text-sm text-gray-500 mt-1">{contactInfo.weekendStatus}</p>
                </div>
              </div>
            </Card>

            {/* وسائل التواصل الاجتماعي */}
            {(contactInfo.facebookUrl || contactInfo.instagramUrl || contactInfo.youtubeUrl) && (
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-primary">تابعنا على</h2>
                </div>
                
                <div className="flex gap-3">
                  {contactInfo.facebookUrl && (
                    <a 
                      href={contactInfo.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Facebook className="h-5 w-5 text-blue-600" />
                    </a>
                  )}
                  {contactInfo.instagramUrl && (
                    <a 
                      href={contactInfo.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-pink-600" />
                    </a>
                  )}
                  {contactInfo.youtubeUrl && (
                    <a 
                      href={contactInfo.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Youtube className="h-5 w-5 text-red-600" />
                    </a>
                  )}
                </div>
              </Card>
            )}
          </motion.div>

          {/* نموذج الاتصال والمعلومات الإضافية */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* نموذج الاتصال */}
            {contactInfo.enableContactForm && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Card className="p-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Send className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary">أرسل لنا رسالة</h2>
                  </div>

                  {submitResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
                        submitResult.type === 'success' 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {submitResult.type === 'success' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      {submitResult.message}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">الاسم الكامل *</Label>
                        <div className="relative">
                          <User className="absolute right-3 top-3 h-4 w-4 text-accent/40" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="أدخل اسمك الكامل"
                            className="pr-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">البريد الإلكتروني *</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-3 h-4 w-4 text-accent/40" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="example@email.com"
                            className="pr-10"
                            dir="ltr"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-3 h-4 w-4 text-accent/40" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="01234567890"
                            className="pr-10"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="company">الشركة (اختياري)</Label>
                        <div className="relative">
                          <Building className="absolute right-3 top-3 h-4 w-4 text-accent/40" />
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => handleChange('company', e.target.value)}
                            placeholder="اسم الشركة"
                            className="pr-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="inquiryType">نوع الاستفسار *</Label>
                        <Select value={formData.inquiryType} onValueChange={(value) => handleChange('inquiryType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INQUIRY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="subject">الموضوع</Label>
                        <div className="relative">
                          <FileText className="absolute right-3 top-3 h-4 w-4 text-accent/40" />
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            placeholder="موضوع الرسالة"
                            className="pr-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">الرسالة *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        rows={5}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin ml-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 ml-2" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* معلومات إضافية */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                <div className="p-3 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-primary mb-2">الشحن والتوصيل</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{contactInfo.shippingInfo}</p>
              </Card>

              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                <div className="p-3 bg-green-50 rounded-full w-fit mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-primary mb-2">طرق الدفع</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{contactInfo.paymentMethods}</p>
              </Card>

              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                <div className="p-3 bg-amber-50 rounded-full w-fit mx-auto mb-4">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-bold text-primary mb-2">الضمان</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{contactInfo.warrantyInfo}</p>
              </Card>
            </motion.div>

            {/* واتساب سريع */}
            {contactInfo.whatsappNumber && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Card className="p-8 border-0 shadow-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-white" />
                  <h3 className="text-2xl font-bold mb-2">تحتاج مساعدة فورية؟</h3>
                  <p className="text-green-100 mb-6">تواصل معنا عبر واتساب للحصول على رد سريع</p>
                  <a
                    href={createWhatsAppLink(contactInfo.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-white text-green-600 font-bold py-3 px-8 rounded-lg hover:bg-green-50 transition-colors text-lg"
                  >
                    <MessageSquare className="h-5 w-5" />
                    ابدأ الدردشة على واتساب
                  </a>
                </Card>
              </motion.div>
            )}

            {/* الأسئلة الشائعة */}
            {contactInfo.enableFaq && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                <ContactFAQ />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}