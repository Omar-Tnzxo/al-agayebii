'use client';

import Link from 'next/link';
import { ShoppingCart, Star, Heart, Eye } from 'lucide-react';
import { useState, useRef } from 'react';
import SafeImage from './SafeImage';
import { formatPrice } from '@/lib/utils/helpers';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  is_popular?: boolean;
  is_new?: boolean;
  stock_quantity?: number;
  category?: {
    name: string;
  };
  slug: string;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard = ({ product, className = '' }: ProductCardProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [flyImage, setFlyImage] = useState<null | { src: string; x: number; y: number; size: number }>();
  const imageRef = useRef<HTMLDivElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);

  // حساب السعر بعد الخصم
  const discountedPrice = product.discount_percentage && product.discount_percentage > 0
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  const isDiscounted = product.discount_percentage && product.discount_percentage > 0;
  const isOutOfStock = product.stock_quantity === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) return;
    
    // أنيميشن الطيران
    if (imageRef.current && cartBtnRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const cartRect = document.querySelector('.header-cart-icon')?.getBoundingClientRect();
      if (cartRect) {
        setFlyImage({
          src: product.image && product.image.trim() ? product.image : '/images/product-default.png',
          x: imgRect.left,
          y: imgRect.top,
          size: imgRect.width
        });
        setTimeout(() => {
          setFlyImage({
            src: product.image && product.image.trim() ? product.image : '/images/product-default.png',
            x: cartRect.left,
            y: cartRect.top,
            size: 32
          });
        }, 10);
        setTimeout(() => setFlyImage(undefined), 700);
        // نبضة على أيقونة الكارت
        const cartIcon = document.querySelector('.header-cart-icon');
        if (cartIcon) {
          cartIcon.classList.add('animate-pulse-cart');
          setTimeout(() => cartIcon.classList.remove('animate-pulse-cart'), 800);
        }
      }
    }
    
    // إضافة المنتج للسلة
    const cartEvent = new CustomEvent('addToCart', {
      detail: {
        product_id: product.id,
        name: product.name,
        price: discountedPrice,
        image: product.image,
        quantity: 1
      }
    });
    window.dispatchEvent(cartEvent);
    toast.success(`تمت إضافة ${product.name} للسلة`);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div
      className={`group relative bg-white rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* صورة المنتج */}
        <div className="relative aspect-square overflow-hidden bg-gray-50" ref={imageRef}>
          <SafeImage
            src={product.image && product.image.trim() ? product.image : '/images/product-default.png'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            fallbackSrc="/images/product-default.png"
          />
          
          {/* شارات المنتج */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {product.is_new && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                جديد
              </span>
            )}
            {product.is_popular && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                مميز
              </span>
            )}
            {isDiscounted && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                -{product.discount_percentage}%
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
                نفذ المخزون
              </span>
            )}
          </div>

          {/* أزرار الإجراءات السريعة */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={() => router.push(`/product/${product.slug}`)}
              className="w-10 h-10 bg-white text-gray-600 hover:bg-primary hover:text-white rounded-full flex items-center justify-center transition-colors active:scale-95"
              aria-label="عرض التفاصيل"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          {/* زر إضافة للسلة (دائمًا ظاهر على الجوال، عند hover فقط على الديسكتوب) */}
          <div className={`absolute bottom-3 left-3 right-3 transform transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 ${isHovered ? 'md:translate-y-0 md:opacity-100' : 'md:translate-y-2 md:opacity-0'}`}>
            <button
              ref={cartBtnRef}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-colors active:scale-95 ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90'
              } header-cart-add-btn`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>
                  {isOutOfStock ? 'نفذ المخزون' : 'أضف للسلة'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* معلومات المنتج */}
        <div className="p-4">
          {/* اسم المنتج */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* التصنيف */}
          {product.category && (
            <p className="text-sm text-gray-500 mb-2">
              {product.category.name}
            </p>
          )}

          {/* التقييم */}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating!)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                ({product.reviews_count || 0})
              </span>
            </div>
          )}

          {/* الأسعار */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(discountedPrice)}
            </span>
            {isDiscounted && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* معلومات المخزون */}
          {product.stock_quantity && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <p className="text-sm text-orange-600 mt-2">
              متبقي {product.stock_quantity} فقط
            </p>
          )}
        </div>
      </Link>
      {/* صورة طيران المنتج */}
      {flyImage && (
        <div
          style={{
            position: 'fixed',
            left: flyImage.x,
            top: flyImage.y,
            width: flyImage.size,
            height: flyImage.size,
            zIndex: 9999,
            pointerEvents: 'none',
            transition: 'all 0.7s cubic-bezier(.4,1.7,.6,.97)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)'
          }}
        >
          <img
            src={flyImage.src}
            alt="flying product"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  );
};

export default ProductCard; 