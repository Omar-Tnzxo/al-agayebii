'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';
import { SocialLinks } from './SocialLinks';
import { useState, useEffect } from 'react';
import { getCart } from '@/lib/store/cart';
import { useSiteSettings } from './SiteSettingsProvider';
import { MiniCart } from './MiniCart';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const { settings } = useSiteSettings();
  
  // استرجاع عدد العناصر في السلة عند تحميل الصفحة
  useEffect(() => {
    function updateCartCount() {
      if (typeof window !== 'undefined') {
        try {
          const cartItems = getCart();
          // التأكد من أن cartItems مصفوفة صحيحة
          if (Array.isArray(cartItems)) {
            const count = cartItems.reduce((total, item) => total + item.quantity, 0);
            setCartCount(count);
          } else {
            console.warn('السلة ليست مصفوفة صحيحة:', cartItems);
            setCartCount(0);
          }
        } catch (error) {
          console.error('خطأ في حساب عدد عناصر السلة:', error);
          setCartCount(0);
        }
      }
    }
    
    // التحديث الأولي
    updateCartCount();
    
    // إعداد مستمع لحدث تغيير السلة
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    
    // إعداد مراقبة دورية للتغييرات (احتياطي لحالات عدم عمل حدث Storage)
    const interval = setInterval(updateCartCount, 2000);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm">
      {/* شريط المعلومات العلوي */}
      <div className="bg-primary text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {settings.contact_primary_phone && (
            <div className="flex items-center text-xs">
              <Phone className="w-3 h-3 ml-1" />
              <span>اتصل بنا: {settings.contact_primary_phone}</span>
            </div>
          )}

          {/* روابط التواصل الاجتماعي */}
          <SocialLinks className="text-white" />
        </div>
      </div>
      
      {/* القائمة الرئيسية */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* الشعار */}
          <Link href="/" className="flex items-center">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={settings.siteName || 'Logo'}
                width={40}
                height={40}
                className="w-10 h-10 mr-2 object-contain"
                priority
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
            )}
            <span className="text-xl font-bold font-tajawal bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{settings.siteName || 'متجر العجايبي'}</span>
          </Link>
          
          {/* القائمة الرئيسية */}
          <nav className="hidden md:flex space-x-2 mx-4">
            <Link href="/" className="px-3 py-2 text-accent hover:text-primary transition-colors font-tajawal">
              الرئيسية
            </Link>
            <Link href="/products" className="px-3 py-2 text-accent hover:text-primary transition-colors font-tajawal">
              المنتجات
            </Link>
            <Link href="/categories" className="px-3 py-2 text-accent hover:text-primary transition-colors font-tajawal">
              التصنيفات
            </Link>
            <Link href="/branches" className="px-3 py-2 flex items-center gap-1 text-accent hover:text-primary transition-colors font-tajawal">
              <MapPin className="w-3 h-3" />
              <span>فروعنا</span>
            </Link>
            <Link href="/about" className="px-3 py-2 text-accent hover:text-primary transition-colors font-tajawal">
              من نحن
            </Link>
            <Link href="/contact" className="px-3 py-2 text-accent hover:text-primary transition-colors font-tajawal">
              اتصل بنا
            </Link>
            <Link href="/track-order" className="px-3 py-2 text-accent hover:text-primary transition-colors font-tajawal">
              تتبع طلبك
            </Link>
          </nav>
          
          {/* أيقونات الإجراءات */}
          <div className="flex items-center space-x-1">
            <button
              className="p-2 rounded-full hover:bg-primary/10 transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary header-cart-icon"
              aria-label="سلة التسوق"
              onClick={() => setIsMiniCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5 text-accent" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-primary/10 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5 text-accent" />
            </button>
          </div>
        </div>
      </div>
      
      {/* القائمة المتنقلة للأجهزة الصغيرة */}
      {isMenuOpen && (
        <div className="block md:hidden bg-white border-t border-gray-100 py-2 px-4">
          <nav className="flex flex-col space-y-2">
            <Link 
              href="/" 
              className="px-3 py-2 text-accent hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              الرئيسية
            </Link>
            <Link 
              href="/products" 
              className="px-3 py-2 text-accent hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              المنتجات
            </Link>
            <Link 
              href="/categories" 
              className="px-3 py-2 text-accent hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              التصنيفات
            </Link>
            <Link
              href="/branches"
              className="px-3 py-2 text-accent hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              فروعنا
            </Link>
            <Link 
              href="/about" 
              className="px-3 py-2 text-accent hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              من نحن
            </Link>
            <Link 
              href="/contact" 
              className="px-3 py-2 text-accent hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              اتصل بنا
            </Link>
            <Link 
              href="/track-order" 
              className="px-3 py-2 text-accent hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              تتبع طلبك
            </Link>
          </nav>
        </div>
      )}
      {/* MiniCart Drawer */}
      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
    </header>
  );
} 