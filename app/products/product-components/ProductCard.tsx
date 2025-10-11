'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  Eye,
  ShoppingCart,
  Zap,
  Crown,
  Flame,
  Package,
  ShieldCheck,
  Badge,
  Tag,
  Palette,
  ImageIcon,
  MessageCircle,
  ThumbsUp,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';

interface ProductCardProps {
  product: any;
  viewMode?: 'grid' | 'list';
  onQuickView?: (product: any) => void;
  onAddToCart?: (product: any) => void;
  onToggleWishlist?: (product: any) => void;
  isWishlisted?: boolean;
  currency: string; // ✅ أضف العملة هنا
}

export function ProductCard({ 
  product, 
  viewMode = 'grid', 
  onQuickView, 
  onAddToCart, 
  onToggleWishlist,
  isWishlisted = false,
  currency // ✅ استقبل العملة
}: ProductCardProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [flyImage, setFlyImage] = useState<null | { src: string; x: number; y: number; size: number }>();
  const imageRef = useRef<HTMLDivElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  // refs لعرض القائمة
  const listImageRef = useRef<HTMLDivElement>(null);
  const listCartBtnRef = useRef<HTMLButtonElement>(null);

  // حالات المنتج
  const isNew = product.is_new;
  const isOnSale = product.discount_percentage > 0;
  const isFeatured = product.is_featured;
  const isExclusive = product.is_exclusive;
  const isPopular = product.is_popular;
  const isInStock = product.stock_quantity > 0;
  const isLowStock = product.stock_quantity <= 5 && product.stock_quantity > 0;
  const isOutOfStock = product.stock_quantity === 0;

  // بيانات الأسعار والتقييمات
  const discountPercentage = product.discount_percentage || 0;
  const originalPrice = product.price;
  const finalPrice = discountPercentage > 0 
    ? originalPrice * (1 - discountPercentage / 100) 
    : originalPrice;
  const savingsAmount = originalPrice - finalPrice;

  // الصور والألوان
  const mainImage = product.image || '/images/placeholder-product.jpg';
  const images = product.product_images || [];
  const colors = product.product_colors || [];


  // رندر الشارات
  const renderBadges = () => {
    const badges = [];
    if (isNew) {
      badges.push(
        <span key="new" className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
          <Zap className="w-3 h-3 mr-1" /> جديد
        </span>
      );
    }
    if (isExclusive) {
      badges.push(
        <span key="exclusive" className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
          <Crown className="w-3 h-3 mr-1 text-yellow-300" /> حصري
        </span>
      );
    }
    if (isOnSale) {
      badges.push(
        <span key="sale" className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
          -{discountPercentage}%
        </span>
      );
    }
    if (isFeatured) {
      badges.push(
        <span key="featured" className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
          <Crown className="w-3 h-3 mr-1" /> مميز
        </span>
      );
    }
    if (isPopular) {
      badges.push(
        <span key="popular" className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
          <Flame className="w-3 h-3 mr-1" /> رائج
        </span>
      );
    }
    return (
      <div className="absolute top-2 left-2 right-2 flex flex-row flex-wrap gap-2 z-10">
        {badges}
      </div>
    );
  };

  // رندر أزرار الإجراءات
  const renderActionButtons = () => (
    <div
      className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 md:gap-2 z-10
        opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0
        transition-all duration-300
      `}
    >
      {/* زر العرض السريع */}
        <button
          onClick={() => onQuickView?.(product)}
        className="w-12 h-12 p-2 text-lg md:w-9 md:h-9 md:p-0.5 md:text-base bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:scale-110 hover:bg-gray-50 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200"
        aria-label="عرض سريع"
        >
        <Eye className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      {/* زر المفضلة */}
        <button
          onClick={() => onToggleWishlist?.(product)}
        className={`w-12 h-12 p-2 text-lg md:w-9 md:h-9 md:p-0.5 md:text-base border rounded-full shadow-md flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-200
          ${isWishlisted ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
        <Heart className={`w-5 h-5 md:w-4 md:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      {/* زر أضف للسلة */}
        <button
        ref={cartBtnRef}
        onClick={handleAddToCartWithAnimation}
        className="w-12 h-12 p-2 text-lg md:w-9 md:h-9 md:p-0.5 md:text-base bg-blue-600 text-white rounded-full shadow-md flex items-center justify-center border border-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300"
        aria-label="أضف للسلة"
        >
        <ShoppingCart className="w-5 h-5 md:w-4 md:h-4" />
        </button>
    </div>
  );

  // رندر الألوان
  const renderColors = () => {
    if (!colors || colors.length === 0) return null;

    return (
      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
        <Palette className="w-4 h-4 text-gray-400" />
        <div className="flex space-x-1 rtl:space-x-reverse">
          {colors.slice(0, 4).map((color: any, index: number) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${
                selectedColor === index ? 'border-blue-500 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color.color_code || '#ccc' }}
              onClick={() => setSelectedColor(index)}
              title={color.color_name}
            />
          ))}
          {colors.length > 4 && (
            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              +{colors.length - 4}
            </div>
          )}
        </div>
      </div>
    );
  };

  // رندر الصور الإضافية
  const renderImageIndicators = () => {
    if (!images || images.length <= 1) return null;

    return (
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
        <ImageIcon className="w-3 h-3 inline mr-1" />
        {images.length}
      </div>
    );
  };

  // أضف منطق الأنيميشن لزر أضف للسلة
  const handleAddToCartWithAnimation = () => {
    // أنيميشن الطيران
    let imgRect: DOMRect | undefined;
    let btnRef: React.RefObject<HTMLButtonElement> | null = null;
    if (viewMode === 'list' && listImageRef.current && listCartBtnRef.current) {
      imgRect = listImageRef.current.getBoundingClientRect();
      btnRef = listCartBtnRef;
    } else if (imageRef.current && cartBtnRef.current) {
      imgRect = imageRef.current.getBoundingClientRect();
      btnRef = cartBtnRef;
    }
    if (imgRect && btnRef && btnRef.current) {
      const cartRect = document.querySelector('.header-cart-icon')?.getBoundingClientRect();
      if (cartRect) {
        setFlyImage({
          src: product.image || '/images/placeholder-product.jpg',
          x: imgRect.left,
          y: imgRect.top,
          size: imgRect.width
        });
        setTimeout(() => {
          setFlyImage({
            src: product.image || '/images/placeholder-product.jpg',
            x: cartRect.left,
            y: cartRect.top,
            size: 32
          });
        }, 10);
        setTimeout(() => setFlyImage(undefined), 1100);
        // نبضة على أيقونة الكارت
        const cartIcon = document.querySelector('.header-cart-icon');
        if (cartIcon) {
          cartIcon.classList.add('animate-pulse-cart');
          setTimeout(() => cartIcon.classList.remove('animate-pulse-cart'), 1200);
        }
      }
    }
    // مناداة onAddToCart الأصلي
    onAddToCart?.(product);
  };

  if (viewMode === 'list') {
    return (
      <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
        <div className="flex p-4">
          {/* صورة المنتج */}
            <div className="relative w-32 h-32 flex-shrink-0 ml-4 bg-gray-50" ref={listImageRef}>
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover rounded-lg"
              onLoad={() => setImageLoading(false)}
            />
            {renderBadges()}
            {renderImageIndicators()}
          </div>

          {/* تفاصيل المنتج */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <Link href={`/product/${product.slug}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              <button
                onClick={() => onToggleWishlist?.(product)}
                className={`p-2 rounded-full transition-colors ${
                  isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {product.description}
            </p>


            {/* الألوان */}
            {renderColors()}

            {/* السعر والإجراءات */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xl font-bold text-blue-600">
                    {formatPrice(finalPrice)} {currency}
                </span>
                {isOnSale && (
                  <span className="text-sm text-gray-500 line-through">
                      {formatPrice(originalPrice)} {currency}
                  </span>
                )}
              </div>

              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => onQuickView?.(product)}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  title="عرض سريع"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {isInStock && (
                  <button
                      ref={listCartBtnRef}
                      onClick={handleAddToCartWithAnimation}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    أضف للسلة
                  </button>
                )}
              </div>
            </div>

            {/* حالة المخزون */}
            <div className="mt-2">
              {isInStock ? (
                <span className="text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  متوفر ({product.stock_quantity} قطعة)
                </span>
              ) : (
                <span className="text-red-600 text-sm font-medium">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  نفذ المخزون
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
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
              transition: 'all 1.1s cubic-bezier(.4,1.7,.6,.97)',
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
      </>
    );
  }

  // عرض الشبكة (Grid View)
  return (
    <>
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* صورة المنتج */}
        <div className="relative aspect-square overflow-hidden bg-gray-50" ref={imageRef}>
        <Link href={`/product/${product.slug}`}>
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setImageLoading(false)}
          />
        </Link>
        
        {/* شارات المنتج */}
        {renderBadges()}
        
        {/* مؤشر الصور */}
        {renderImageIndicators()}
        
        {/* أزرار الإجراءات */}
        {renderActionButtons()}
      </div>

      {/* تفاصيل المنتج */}
      <div className="p-4">
        {/* اسم المنتج */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>


        {/* الألوان */}
        {renderColors()}

        {/* السعر */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-xl font-bold text-blue-600">
                {formatPrice(finalPrice)} {currency}
            </span>
            {isOnSale && (
              <span className="text-sm text-gray-500 line-through">
                  {formatPrice(originalPrice)} {currency}
              </span>
            )}
          </div>
          {isOnSale && (
            <span className="text-sm text-green-600 font-medium">
                وفر {formatPrice(savingsAmount)} {currency}
            </span>
          )}
        </div>

        {/* حالة المخزون */}
        <div className="text-sm">
          {isInStock ? (
            <span className="text-green-600 font-medium">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              متوفر
            </span>
          ) : (
            <span className="text-red-600 font-medium">
              <XCircle className="w-4 h-4 inline mr-1" />
              نفذ المخزون
            </span>
          )}
        </div>
      </div>
    </div>
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
            transition: 'all 1.1s cubic-bezier(.4,1.7,.6,.97)',
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
    </>
  );
}

export default ProductCard; 