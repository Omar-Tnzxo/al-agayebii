'use client';

import Link from 'next/link';
import { SocialLinks } from './SocialLinks';
import { StoreLocations } from './StoreLocations';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { useSiteSettings } from './SiteSettingsProvider';

export function Footer() {
  const { settings } = useSiteSettings();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* القسم الأول: معلومات حول المتجر */}
          <div>
            <h3 className="text-xl font-bold mb-4 ar-title">{settings.siteName || 'متجر العجايبي'}</h3>
            <p className="text-primary-100 mb-4">
              {settings.siteDescription || 'المتجر الرائد للأدوات الكهربائية والصحية بأفضل الأسعار وأعلى جودة في جمهورية مصر العربية'}
            </p>
            <div className="mt-4">
              <SocialLinks className="text-white hover:text-primary-200" />
            </div>
          </div>
          
          {/* القسم الثاني: روابط سريعة */}
          <div>
            <h3 className="text-xl font-bold mb-4 ar-title">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-primary-100 hover:text-white transition-colors">
                  الصفحة الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-primary-100 hover:text-white transition-colors">
                  المنتجات
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-primary-100 hover:text-white transition-colors">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-primary-100 hover:text-white transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary-100 hover:text-white transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>
          
          {/* القسم الثالث: مواقع المحلات */}
          <div>
            <h3 className="text-xl font-bold mb-4 ar-title">فروعنا</h3>
            <div className="space-y-3">
              <p className="text-primary-100 mb-3">
                لدينا العديد من الفروع في مواقع متميزة لخدمتكم بشكل أفضل
              </p>
              <Link
                href="/branches"
                className="inline-flex items-center gap-2 text-primary-100 hover:text-white transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>عرض جميع الفروع</span>
              </Link>
            </div>
          </div>
          
          {/* القسم الرابع: معلومات الاتصال */}
          <div>
            <h3 className="text-xl font-bold mb-4 ar-title">اتصل بنا</h3>
            <ul className="space-y-3">
              {settings.contact_full_address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary-100 mt-0.5" />
                  <span className="text-primary-100">
                    {settings.contact_full_address}
                  </span>
                </li>
              )}
              {settings.contact_primary_phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-100" />
                  <Link
                    href={`tel:${settings.contact_primary_phone}`}
                    className="text-primary-100 hover:text-white transition-colors"
                  >
                    {settings.contact_primary_phone}
                  </Link>
                </li>
              )}
              {settings.contact_whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-100" />
                  <Link
                    href={`https://wa.me/${settings.contact_whatsapp.replace(/^\+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-100 hover:text-white transition-colors"
                  >
                    واتساب
                  </Link>
                </li>
              )}
              {settings.contact_primary_email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-100" />
                  <Link
                    href={`mailto:${settings.contact_primary_email}`}
                    className="text-primary-100 hover:text-white transition-colors"
                  >
                    {settings.contact_primary_email}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      {/* شريط حقوق النشر */}
      <div className="border-t border-primary-700 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-primary-100">
          <p>
            &copy; {currentYear} متجر العجايبي. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
} 