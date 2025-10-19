'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Send,
  MessageSquare,
  Share2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ContactInfo } from '@/lib/types/contact';
import { formatPhone, createWhatsAppLink, createMapsLink } from '@/lib/utils/contact';

// أيقونة TikTok مخصصة
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// أيقونات السوشيال ميديا
const socialIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  facebook: { icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100' },
  instagram: { icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50 hover:bg-pink-100' },
  twitter: { icon: Twitter, color: 'text-sky-500', bgColor: 'bg-sky-50 hover:bg-sky-100' },
  linkedin: { icon: Linkedin, color: 'text-blue-700', bgColor: 'bg-blue-50 hover:bg-blue-100' },
  youtube: { icon: Youtube, color: 'text-red-600', bgColor: 'bg-red-50 hover:bg-red-100' },
  tiktok: { icon: TikTokIcon, color: 'text-gray-800', bgColor: 'bg-gray-100 hover:bg-gray-200' },
  telegram: { icon: Send, color: 'text-blue-500', bgColor: 'bg-blue-50 hover:bg-blue-100' },
  snapchat: { icon: MessageSquare, color: 'text-yellow-500', bgColor: 'bg-yellow-50 hover:bg-yellow-100' },
  pinterest: { icon: Share2, color: 'text-red-700', bgColor: 'bg-red-50 hover:bg-red-100' },
  whatsappBusiness: { icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
};

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

  // جمع روابط السوشيال ميديا النشطة
  const socialLinks = [
    { name: 'facebook', url: contactInfo.facebookUrl, label: 'فيسبوك' },
    { name: 'instagram', url: contactInfo.instagramUrl, label: 'إنستغرام' },
    { name: 'twitter', url: contactInfo.twitterUrl, label: 'تويتر' },
    { name: 'linkedin', url: contactInfo.linkedinUrl, label: 'لينكد إن' },
    { name: 'youtube', url: contactInfo.youtubeUrl, label: 'يوتيوب' },
    { name: 'tiktok', url: contactInfo.tiktokUrl, label: 'تيك توك' },
    { name: 'telegram', url: contactInfo.telegramUrl, label: 'تيليجرام' },
    { name: 'snapchat', url: contactInfo.snapchatUrl, label: 'سناب شات' },
    { name: 'pinterest', url: contactInfo.pinterestUrl, label: 'بينترست' },
    { name: 'whatsappBusiness', url: contactInfo.whatsappBusinessUrl, label: 'واتساب بزنس' },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-primary/90 py-16"
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{contactInfo.companyName}</h1>
          <p className="text-xl text-primary-100">{contactInfo.tagline}</p>
        </div>
      </motion.section>

      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {/* معلومات الاتصال */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="p-6 h-full">
              <h2 className="text-2xl font-bold text-primary mb-6">معلومات الاتصال</h2>

              <div className="space-y-4">
                {/* الهاتف */}
                {contactInfo.primaryPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">الهاتف</p>
                      <a
                        href={`tel:${contactInfo.primaryPhone}`}
                        className="font-semibold text-gray-800 hover:text-primary transition-colors"
                        dir="ltr"
                      >
                        {formatPhone(contactInfo.primaryPhone)}
                      </a>
                    </div>
                  </div>
                )}

                {/* البريد الإلكتروني */}
                {contactInfo.primaryEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                      <a
                        href={`mailto:${contactInfo.primaryEmail}`}
                        className="font-semibold text-gray-800 hover:text-primary transition-colors break-all"
                        dir="ltr"
                      >
                        {contactInfo.primaryEmail}
                      </a>
                    </div>
                  </div>
                )}

                {/* واتساب */}
                {contactInfo.whatsappNumber && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">واتساب</p>
                      <a
                        href={createWhatsAppLink(contactInfo.whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-green-600 hover:text-green-700 transition-colors inline-flex items-center gap-1"
                        dir="ltr"
                      >
                        {formatPhone(contactInfo.whatsappNumber)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* العنوان وساعات العمل */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="p-6 h-full">
              <h2 className="text-2xl font-bold text-primary mb-6">موقعنا</h2>

              <div className="space-y-4">
                {/* العنوان */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">العنوان</p>
                    <p className="font-semibold text-gray-800">{contactInfo.fullAddress}</p>
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
                </div>

                {/* ساعات العمل */}
                <div className="flex items-start gap-3 pt-4 border-t">
                  <Clock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ساعات العمل</p>
                    <p className="font-semibold text-gray-800">{contactInfo.workingDays}</p>
                    <p className="text-gray-600">{contactInfo.workingHours}</p>
                    <p className="text-sm text-gray-500 mt-1">{contactInfo.weekendStatus}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* وسائل التواصل الاجتماعي */}
        {socialLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 max-w-6xl mx-auto"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-6 text-center">تابعنا على</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {socialLinks.map((link) => {
                  const config = socialIcons[link.name];
                  const Icon = config.icon;
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${config.bgColor}`}
                      title={link.label}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <span className="text-sm font-medium text-gray-700">{link.label}</span>
                    </a>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
