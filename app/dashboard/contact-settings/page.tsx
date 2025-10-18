'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Globe,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { ContactInfo } from '@/lib/types/contact';

export default function ContactSettingsPage() {
  const [settings, setSettings] = useState<Partial<ContactInfo>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // جلب الإعدادات الحالية
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/contact');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'فشل في حفظ الإعدادات' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof ContactInfo, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">إعدادات صفحة الاتصال</h1>
          <p className="text-gray-500 mt-2">إدارة محتوى ومعلومات صفحة اتصل بنا</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* المعلومات الأساسية */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">المعلومات الأساسية</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">اسم الشركة</Label>
              <Input
                id="companyName"
                value={settings.companyName || ''}
                onChange={(e) => updateSetting('companyName', e.target.value)}
                placeholder="متجر العجايبي"
              />
            </div>
            
            <div>
              <Label htmlFor="tagline">الشعار</Label>
              <Input
                id="tagline"
                value={settings.tagline || ''}
                onChange={(e) => updateSetting('tagline', e.target.value)}
                placeholder="متجرك الموثوق للأدوات الكهربائية"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={settings.description || ''}
              onChange={(e) => updateSetting('description', e.target.value)}
              placeholder="وصف موجز عن المتجر وخدماته"
              rows={3}
            />
          </div>
        </Card>

        {/* معلومات الاتصال */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">معلومات الاتصال</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryPhone">الهاتف الأساسي *</Label>
              <Input
                id="primaryPhone"
                value={settings.primaryPhone || ''}
                onChange={(e) => updateSetting('primaryPhone', e.target.value)}
                placeholder="01234567890"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="secondaryPhone">هاتف إضافي</Label>
              <Input
                id="secondaryPhone"
                value={settings.secondaryPhone || ''}
                onChange={(e) => updateSetting('secondaryPhone', e.target.value)}
                placeholder="01987654321"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="whatsappNumber">رقم واتساب *</Label>
              <Input
                id="whatsappNumber"
                value={settings.whatsappNumber || ''}
                onChange={(e) => updateSetting('whatsappNumber', e.target.value)}
                placeholder="+201234567890"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="primaryEmail">البريد الأساسي *</Label>
              <Input
                id="primaryEmail"
                type="email"
                value={settings.primaryEmail || ''}
                onChange={(e) => updateSetting('primaryEmail', e.target.value)}
                placeholder="info@alagayebi.com"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="salesEmail">بريد المبيعات</Label>
              <Input
                id="salesEmail"
                type="email"
                value={settings.salesEmail || ''}
                onChange={(e) => updateSetting('salesEmail', e.target.value)}
                placeholder="sales@alagayebi.com"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="supportEmail">بريد الدعم</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail || ''}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                placeholder="support@alagayebi.com"
                dir="ltr"
              />
            </div>
          </div>
        </Card>

        {/* معلومات العنوان */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">معلومات العنوان</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="fullAddress">العنوان الكامل *</Label>
              <Input
                id="fullAddress"
                value={settings.fullAddress || ''}
                onChange={(e) => updateSetting('fullAddress', e.target.value)}
                placeholder="الجيزه 6 اكتوبر ابني بيتك المرحلة السادسة"
              />
            </div>
            
            <div>
              <Label htmlFor="city">المدينة *</Label>
              <Input
                id="city"
                value={settings.city || ''}
                onChange={(e) => updateSetting('city', e.target.value)}
                placeholder="6 أكتوبر"
              />
            </div>
            
            <div>
              <Label htmlFor="governorate">المحافظة *</Label>
              <Input
                id="governorate"
                value={settings.governorate || ''}
                onChange={(e) => updateSetting('governorate', e.target.value)}
                placeholder="الجيزة"
              />
            </div>
            
            <div>
              <Label htmlFor="postalCode">الرمز البريدي</Label>
              <Input
                id="postalCode"
                value={settings.postalCode || ''}
                onChange={(e) => updateSetting('postalCode', e.target.value)}
                placeholder="12573"
              />
            </div>
            
            <div>
              <Label htmlFor="landmark">معلم مميز</Label>
              <Input
                id="landmark"
                value={settings.landmark || ''}
                onChange={(e) => updateSetting('landmark', e.target.value)}
                placeholder="بجوار مسجد النور"
              />
            </div>
          </div>
        </Card>

        {/* ساعات العمل */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">ساعات العمل</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="workingDays">أيام العمل</Label>
              <Input
                id="workingDays"
                value={settings.workingDays || ''}
                onChange={(e) => updateSetting('workingDays', e.target.value)}
                placeholder="السبت - الخميس"
              />
            </div>
            
            <div>
              <Label htmlFor="workingHours">ساعات العمل</Label>
              <Input
                id="workingHours"
                value={settings.workingHours || ''}
                onChange={(e) => updateSetting('workingHours', e.target.value)}
                placeholder="9:00 صباحاً - 9:00 مساءً"
              />
            </div>
            
            <div>
              <Label htmlFor="weekendStatus">يوم الراحة</Label>
              <Input
                id="weekendStatus"
                value={settings.weekendStatus || ''}
                onChange={(e) => updateSetting('weekendStatus', e.target.value)}
                placeholder="مغلق يوم الجمعة"
              />
            </div>
          </div>
        </Card>

        {/* وسائل التواصل الاجتماعي */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">وسائل التواصل الاجتماعي</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebookUrl">فيسبوك</Label>
              <Input
                id="facebookUrl"
                value={settings.facebookUrl || ''}
                onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/alagayebi"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="instagramUrl">انستغرام</Label>
              <Input
                id="instagramUrl"
                value={settings.instagramUrl || ''}
                onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/alagayebi"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="tiktokUrl">تيك توك</Label>
              <Input
                id="tiktokUrl"
                value={settings.tiktokUrl || ''}
                onChange={(e) => updateSetting('tiktokUrl', e.target.value)}
                placeholder="https://tiktok.com/@alagayebi"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="youtubeUrl">يوتيوب</Label>
              <Input
                id="youtubeUrl"
                value={settings.youtubeUrl || ''}
                onChange={(e) => updateSetting('youtubeUrl', e.target.value)}
                placeholder="https://youtube.com/alagayebi"
                dir="ltr"
              />
            </div>
          </div>
        </Card>

        {/* إعدادات إضافية */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">إعدادات إضافية</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableContactForm">تفعيل نموذج الاتصال</Label>
              <Switch
                id="enableContactForm"
                checked={settings.enableContactForm || false}
                onCheckedChange={(checked) => updateSetting('enableContactForm', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showMap">إظهار الخريطة</Label>
              <Switch
                id="showMap"
                checked={settings.showMap || false}
                onCheckedChange={(checked) => updateSetting('showMap', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enableFaq">تفعيل الأسئلة الشائعة</Label>
              <Switch
                id="enableFaq"
                checked={settings.enableFaq || false}
                onCheckedChange={(checked) => updateSetting('enableFaq', checked)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}