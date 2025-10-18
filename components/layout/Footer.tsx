import Link from 'next/link';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-accent/5 pt-12 pb-6" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* معلومات الشركة */}
          <div>
            <h3 className="font-bold text-xl mb-4 text-primary">متجر العجايبي</h3>
            <p className="text-gray-600 mb-4">
              متجر متخصص في بيع الأدوات الكهربائية والصحية ومستلزمات البناء بأفضل الأسعار وأعلى جودة.
            </p>
            <div className="flex space-x-4 space-x-reverse">
              <a href="#" className="text-accent hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-accent hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-accent hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-accent hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* روابط سريعة */}
          <div>
            <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 hover:text-primary transition-colors">
                  المنتجات
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-primary transition-colors">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>
          
          {/* روابط المستخدم */}
          <div>
            <h3 className="font-bold text-lg mb-4">حسابي</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-primary transition-colors">
                  الملف الشخصي
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="text-gray-600 hover:text-primary transition-colors">
                  طلباتي
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-600 hover:text-primary transition-colors">
                  عربة التسوق
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-gray-600 hover:text-primary transition-colors">
                  المفضلة
                </Link>
              </li>
            </ul>
          </div>
          
          {/* معلومات الاتصال */}
          <div>
            <h3 className="font-bold text-lg mb-4">اتصل بنا</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-gray-600">123 شارع النيل، القاهرة، مصر</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+20123456789" className="text-gray-600 hover:text-primary transition-colors">
                  +20123456789
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:info@agayebi.com" className="text-gray-600 hover:text-primary transition-colors">
                  info@agayebi.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-accent/10 my-8" />
        
        {/* الشريط السفلي وحقوق النشر */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} متجر العجايبي. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-gray-500 text-sm hover:text-primary transition-colors">
              سياسة الخصوصية
            </Link>
            <Link href="/terms" className="text-gray-500 text-sm hover:text-primary transition-colors">
              الشروط والأحكام
            </Link>
            <Link href="/shipping" className="text-gray-500 text-sm hover:text-primary transition-colors">
              سياسة الشحن
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 