'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Zap,
  Crown,
  Flame,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Share2,
  ExternalLink
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: any, quantity: number) => void;
  onToggleWishlist?: (product: any) => void;
  isWishlisted?: boolean;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false
}: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  // إعادة تعيين الحالة عند فتح المودال
  useEffect(() => {
    if (isOpen && product) {
      setSelectedImage(0);
      setSelectedColor(null);
      setQuantity(1);
      setImageLoading(true);
    }
  }, [isOpen, product]);

  // إغلاق المودال عند الضغط على Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // منع التمرير في الخلفية عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // حالات المنتج
  const isNew = product.is_new;
  const isOnSale = product.discount_percentage > 0;
  const isFeatured = product.is_featured;
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
          <Zap className="w-3 h-3 mr-1" />
          جديد
        </span>
      );
    }

    if (isOnSale) {
      badges.push(
        <span key="sale" className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          خصم {discountPercentage}%
        </span>
      );
    }

    if (isFeatured) {
      badges.push(
        <span key="featured" className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
          <Crown className="w-3 h-3 mr-1" />
          مميز
        </span>
      );
    }

    if (isPopular) {
      badges.push(
        <span key="popular" className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
          <Flame className="w-3 h-3 mr-1" />
          رائج
        </span>
      );
    }

    return badges;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart && isInStock) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* خلفية المودال */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* محتوى المودال */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* زر الإغلاق */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* قسم الصور */}
            <div className="space-y-4">
              {/* الصورة الرئيسية */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {(() => {
                  const imageSrc = fallbackSrc || (images.length > 0 ? images[selectedImage]?.image_url : mainImage) || mainImage;
                  console.log('QuickView image src:', imageSrc);
                  return (
                    <Image
                      src={imageSrc}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        if (!fallbackSrc) setFallbackSrc(mainImage);
                      }}
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  );
                })()}
                
                {/* شارات المنتج */}
                <div className="absolute top-2 left-2 space-y-2">
                  {renderBadges()}
                </div>

                {/* مؤشر التحميل */}
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* الصور المصغرة */}
              {images.length > 1 && (
                <div className="flex space-x-2 rtl:space-x-reverse overflow-x-auto">
                  {images.map((image: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image.image_url}
                        alt={`${product.name} - صورة ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* قسم المعلومات */}
            <div className="space-y-6">
              {/* اسم المنتج */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h2>
                
                {/* التقييم */}

                {/* SKU */}
                {product.sku && (
                  <p className="text-sm text-gray-500">
                    رمز المنتج: {product.sku}
                  </p>
                )}
              </div>

              {/* السعر */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(finalPrice)}
                  </span>
                  {isOnSale && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
                {isOnSale && (
                  <p className="text-green-600 font-medium">
                    وفر {formatPrice(savingsAmount)} ({discountPercentage}% خصم)
                  </p>
                )}
              </div>

              {/* الوصف */}
              {product.description && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">الوصف</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* الألوان */}
              {colors.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">الألوان المتاحة</h4>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    {colors.map((color: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(index)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === index ? 'border-blue-500 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.color_code || '#ccc' }}
                        title={color.color_name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* حالة المخزون */}
              <div>
                {isInStock ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">
                      متوفر في المخزون ({product.stock_quantity} قطعة)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">نفذ المخزون</span>
                  </div>
                )}
                
                {isLowStock && (
                  <div className="flex items-center text-yellow-600 mt-1">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="text-sm">كمية محدودة متبقية</span>
                  </div>
                )}
              </div>

              {/* الكمية وأزرار الإجراءات */}
              {isInStock && (
                <div className="space-y-4">
                  {/* محدد الكمية */}
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <label className="text-sm font-medium text-gray-700">الكمية:</label>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 text-center min-w-[50px]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= product.stock_quantity}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex space-x-3 rtl:space-x-reverse">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      أضف للسلة
                    </button>
                    
                    <button
                      onClick={() => onToggleWishlist?.(product)}
                      className={`p-3 rounded-lg border transition-colors ${
                        isWishlisted 
                          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                      className="p-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      title="عرض الصفحة الكاملة"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* إجمالي السعر */}
              {isInStock && quantity > 1 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">إجمالي السعر:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(finalPrice * quantity)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickViewModal; 