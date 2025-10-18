'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  Home,
  Package,
  Grid
} from 'lucide-react';
import SearchBar from '@/components/SearchBar';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  useEffect(() => {
    // التحقق من تمرير الصفحة
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // تنظيف المستمعين
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleToggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setIsMenuOpen(false);
    }
  };

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsSearchOpen(false);
    }
  };
  
  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-md'
      }`}
      dir="rtl"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-bold text-xl text-primary">متجر العجايبي</span>
          </Link>

          {/* قائمة التنقل للشاشات الكبيرة */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-accent hover:text-primary transition-colors whitespace-nowrap">
              الرئيسية
            </Link>
            <Link href="/products" className="text-accent hover:text-primary transition-colors whitespace-nowrap">
              المنتجات
            </Link>
            <Link href="/categories" className="text-accent hover:text-primary transition-colors whitespace-nowrap">
              التصنيفات
            </Link>
          </nav>
          
          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* زر البحث - يعمل في جميع الأحجام */}
            <button 
              onClick={handleToggleSearch}
              className="p-2 rounded-full hover:bg-accent/5 transition-colors"
              aria-label="البحث"
              aria-expanded={isSearchOpen}
            >
              {isSearchOpen ? (
                <X className="h-5 w-5 text-accent" />
              ) : (
                <Search className="h-5 w-5 text-accent" />
              )}
            </button>
            
            {/* زر عربة التسوق */}
            <Link 
              href="/cart" 
              className="p-2 rounded-full hover:bg-accent/5 transition-colors relative"
              aria-label="عربة التسوق"
            >
              <ShoppingCart className="h-5 w-5 text-accent" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {/* زر القائمة للشاشات الصغيرة */}
            <button 
              onClick={handleToggleMenu}
              className="md:hidden p-2 rounded-full hover:bg-accent/5 transition-colors"
              aria-label="القائمة"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-accent" />
              ) : (
                <Menu className="h-5 w-5 text-accent" />
              )}
            </button>
          </div>
        </div>

        {/* شريط البحث - يظهر عند الضغط على زر البحث في أي حجم شاشة */}
        {isSearchOpen && (
          <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
            <SearchBar variant="hero" autoFocus />
          </div>
        )}
      </div>
      
      {/* القائمة للشاشات الصغيرة */}
      {isMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden bg-white border-t border-accent/10 py-4 animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="container mx-auto px-4 space-y-3">
            <Link 
              href="/" 
              className="flex items-center gap-2 p-2 hover:bg-accent/5 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-5 w-5 text-primary" />
              <span>الرئيسية</span>
            </Link>
            <Link 
              href="/products" 
              className="flex items-center gap-2 p-2 hover:bg-accent/5 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Package className="h-5 w-5 text-primary" />
              <span>المنتجات</span>
            </Link>
            <Link 
              href="/categories" 
              className="flex items-center gap-2 p-2 hover:bg-accent/5 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Grid className="h-5 w-5 text-primary" />
              <span>التصنيفات</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}