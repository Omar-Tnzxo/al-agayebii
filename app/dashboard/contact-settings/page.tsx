'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, CheckCircle, AlertCircle, Phone, Mail, MapPin, Clock, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ContactSettings {
  company_name: string;
  tagline: string;
  description: string;
  primary_phone: string;
  secondary_phone: string;
  whatsapp: string;
  primary_email: string;
  sales_email: string;
  support_email: string;
  full_address: string;
  city: string;
  governorate: string;
  postal_code: string;
  landmark: string;
  working_days: string;
  working_hours: string;
  weekend_status: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  tiktok_url: string;
  snapchat_url: string;
  telegram_url: string;
  pinterest_url: string;
  whatsapp_business_url: string;
}

export default function ContactSettingsPage() {
  const [settings, setSettings] = useState<ContactSettings>({
    company_name: '', tagline: '', description: '', primary_phone: '', secondary_phone: '',
    whatsapp: '', primary_email: '', sales_email: '', support_email: '', full_address: '',
    city: '', governorate: '', postal_code: '', landmark: '', working_days: '',
    working_hours: '', weekend_status: '', facebook_url: '', instagram_url: '',
    twitter_url: '', linkedin_url: '', youtube_url: '', tiktok_url: '',
    snapchat_url: '', telegram_url: '', pinterest_url: '', whatsapp_business_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/contact');
      const result = await response.json();
      if (result.success && result.data) {
        const d = result.data;
        setSettings({
          company_name: d.companyName || '', tagline: d.tagline || '', description: d.description || '',
          primary_phone: d.primaryPhone || '', secondary_phone: d.secondaryPhone || '',
          whatsapp: d.whatsappNumber || '', primary_email: d.primaryEmail || '',
          sales_email: d.salesEmail || '', support_email: d.supportEmail || '',
          full_address: d.fullAddress || '', city: d.city || '', governorate: d.governorate || '',
          postal_code: d.postalCode || '', landmark: d.landmark || '',
          working_days: d.workingDays || '', working_hours: d.workingHours || '',
          weekend_status: d.weekendStatus || '', facebook_url: d.facebookUrl || '',
          instagram_url: d.instagramUrl || '', twitter_url: d.twitterUrl || '',
          linkedin_url: d.linkedinUrl || '', youtube_url: d.youtubeUrl || '',
          tiktok_url: d.tiktokUrl || '', snapchat_url: d.snapchatUrl || '',
          telegram_url: d.telegramUrl || '', pinterest_url: d.pinterestUrl || '',
          whatsapp_business_url: d.whatsappBusinessUrl || '',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (result.success) {
        showMessage('success', 'تم الحفظ بنجاح');
      } else {
        showMessage('error', result.error || 'فشل الحفظ');
      }
    } catch (error) {
      showMessage('error', 'خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ContactSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">إعدادات التواصل</h1>
          <p className="text-gray-600">إدارة معلومات الاتصال ووسائل التواصل الاجتماعي</p>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">معلومات الشركة</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>اسم الشركة</Label>
                <Input value={settings.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>الشعار</Label>
                <Input value={settings.tagline} onChange={(e) => handleChange('tagline', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>الوصف</Label>
                <Textarea value={settings.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">معلومات الاتصال</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الهاتف الأساسي</Label>
                <Input value={settings.primary_phone} onChange={(e) => handleChange('primary_phone', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>الهاتف الثانوي</Label>
                <Input value={settings.secondary_phone} onChange={(e) => handleChange('secondary_phone', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>واتساب</Label>
                <Input value={settings.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>البريد الأساسي</Label>
                <Input type="email" value={settings.primary_email} onChange={(e) => handleChange('primary_email', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>بريد المبيعات</Label>
                <Input type="email" value={settings.sales_email} onChange={(e) => handleChange('sales_email', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>بريد الدعم</Label>
                <Input type="email" value={settings.support_email} onChange={(e) => handleChange('support_email', e.target.value)} dir="ltr" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">العنوان</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>العنوان الكامل</Label>
                <Input value={settings.full_address} onChange={(e) => handleChange('full_address', e.target.value)} />
              </div>
              <div>
                <Label>المدينة</Label>
                <Input value={settings.city} onChange={(e) => handleChange('city', e.target.value)} />
              </div>
              <div>
                <Label>المحافظة</Label>
                <Input value={settings.governorate} onChange={(e) => handleChange('governorate', e.target.value)} />
              </div>
              <div>
                <Label>الرمز البريدي</Label>
                <Input value={settings.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} />
              </div>
              <div>
                <Label>علامة مميزة</Label>
                <Input value={settings.landmark} onChange={(e) => handleChange('landmark', e.target.value)} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">ساعات العمل</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>أيام العمل</Label>
                <Input value={settings.working_days} onChange={(e) => handleChange('working_days', e.target.value)} />
              </div>
              <div>
                <Label>ساعات العمل</Label>
                <Input value={settings.working_hours} onChange={(e) => handleChange('working_hours', e.target.value)} />
              </div>
              <div>
                <Label>حالة العطلة</Label>
                <Input value={settings.weekend_status} onChange={(e) => handleChange('weekend_status', e.target.value)} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">وسائل التواصل الاجتماعي</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>فيسبوك</Label>
                <Input value={settings.facebook_url} onChange={(e) => handleChange('facebook_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>إنستغرام</Label>
                <Input value={settings.instagram_url} onChange={(e) => handleChange('instagram_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>تويتر</Label>
                <Input value={settings.twitter_url} onChange={(e) => handleChange('twitter_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>لينكد إن</Label>
                <Input value={settings.linkedin_url} onChange={(e) => handleChange('linkedin_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>يوتيوب</Label>
                <Input value={settings.youtube_url} onChange={(e) => handleChange('youtube_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>تيك توك</Label>
                <Input value={settings.tiktok_url} onChange={(e) => handleChange('tiktok_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>تيليجرام</Label>
                <Input value={settings.telegram_url} onChange={(e) => handleChange('telegram_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>سناب شات</Label>
                <Input value={settings.snapchat_url} onChange={(e) => handleChange('snapchat_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>بينترست</Label>
                <Input value={settings.pinterest_url} onChange={(e) => handleChange('pinterest_url', e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>واتساب بزنس</Label>
                <Input value={settings.whatsapp_business_url} onChange={(e) => handleChange('whatsapp_business_url', e.target.value)} dir="ltr" />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white px-8 py-3">
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 ml-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}