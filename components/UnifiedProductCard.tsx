'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart } from 'lucide-react';
import { useLiveSiteSettings } from '@/app/components/useLiveSiteSettings';
import { toast } from 'sonner';
import { addToCart } from '@/lib/store/cart';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  stock_quantity?: number;
  slug: string;
  category_type?: string;
  sku?: string;
}

interface UnifiedProductCardProps {
  product: Product;
  className?: string;
}

export default function UnifiedProductCard({ product, className = '' }: UnifiedProductCardProps) {
  const { settings } = useLiveSiteSettings();
  const reviewsEnabled = settings.reviews_enabled === 'true';
  const [isAdding, setIsAdding] = useState(false);
  
  // حساب السعر بعد الخصم
  const discountedPrice = product.discount_percentage && product.discount_percentage > 0
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  const isDiscounted = product.discount_percentage && product.discount_percentage > 0;
  const isOutOfStock = product.stock_quantity === 0;

  // إضافة للسلة مع أنيميشن
  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock || isAdding) return;
    
    setIsAdding(true);
    
    try {
      // الحصول على موقع الزر
      const button = e.currentTarget;
      const buttonRect = button.getBoundingClientRect();
      
      // الحصول على موقع أيقونة السلة في الهيدر
      const cartIcon = document.querySelector('[data-cart-icon]');
      const cartRect = cartIcon?.getBoundingClientRect();
      
      // إنشاء صورة مؤقتة للأنيميشن
      if (product.image && cartRect) {
        const flyingImage = document.createElement('div');
        flyingImage.style.position = 'fixed';
        flyingImage.style.left = `${buttonRect.left}px`;
        flyingImage.style.top = `${buttonRect.top}px`;
        flyingImage.style.width = '60px';
        flyingImage.style.height = '60px';
        flyingImage.style.zIndex = '9999';
        flyingImage.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        flyingImage.style.pointerEvents = 'none';
        
        flyingImage.innerHTML = `
          <img 
            src="${product.image}" 
            alt="${product.name}"
            style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
          />
        `;
        
        document.body.appendChild(flyingImage);
        
        // بدء الأنيميشن
        setTimeout(() => {
          flyingImage.style.left = `${cartRect.left + cartRect.width / 2 - 30}px`;
          flyingImage.style.top = `${cartRect.top + cartRect.height / 2 - 30}px`;
          flyingImage.style.transform = 'scale(0.3)';
          flyingImage.style.opacity = '0';
        }, 50);
        
        // حذف العنصر بعد انتهاء الأنيميشن
        setTimeout(() => {
          document.body.removeChild(flyingImage);
        }, 900);
      }
      
      // إضافة المنتج للسلة
      await addToCart({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        image: product.image || '',
        discount_percentage: product.discount_percentage || 0,
        slug: product.slug,
        stock_quantity: product.stock_quantity || 0,
        category_type: product.category_type || 'other',
        sku: product.sku || product.id,
        is_active: true,
        is_popular: false,
        is_new: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any, 1);
      
      toast.success(
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">تمت الإضافة بنجاح!</p>
            <p className="text-xs opacity-90">{product.name}</p>
          </div>
        </div>,
        {
          duration: 2500,
          style: {
            fontFamily: 'Tajawal, sans-serif',
            direction: 'rtl',
          },
        }
      );
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('حدث خطأ أثناء إضافة المنتج للسلة');
    } finally {
      setTimeout(() => setIsAdding(false), 1000);
    }
  };

  return (
    <div className={`group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${className}`}>
      <Link href={`/product/${product.slug}`}>
        {/* صورة المنتج */}
        <div className="relative bg-gray-100 aspect-square">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <span className="text-4xl">📦</span>
            </div>
          )}

          {/* شارة الخصم */}
          {isDiscounted && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold z-10">
              -{Math.round(product.discount_percentage || 0)}%
            </div>
          )}

          {/* شارة نفاذ المخزون */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">
                نفذت الكمية
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* معلومات المنتج */}
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* التقييم */}
          {reviewsEnabled && product.rating && product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-medium">{product.rating}</span>
              {product.reviews_count && (
                <span className="text-xs text-gray-500">
                  ({product.reviews_count})
                </span>
              )}
            </div>
          )}

          {/* السعر */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-primary">
              {discountedPrice.toLocaleString('ar-EG')} جنيه
            </span>
            {isDiscounted && (
              <span className="text-sm text-gray-400 line-through">
                {product.price.toLocaleString('ar-EG')} جنيه
              </span>
            )}
          </div>
        </Link>

        {/* زر إضافة للسلة */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            isOutOfStock || isAdding
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
          }`}
        >
          <ShoppingCart className={`h-4 w-4 ${isAdding ? 'animate-bounce' : ''}`} />
          <span>
            {isOutOfStock ? 'نفذ المخزون' : isAdding ? 'جاري الإضافة...' : 'أضف للسلة'}
          </span>
        </button>
      </div>
    </div>
  );
}
