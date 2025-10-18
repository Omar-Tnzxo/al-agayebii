'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import UnifiedProductCard from '@/components/UnifiedProductCard';

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
  slug: string;
  sku: string;
  category?: {
    name: string;
  };
}

interface OffersCarouselProps {
  products: Product[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const OffersCarousel = ({ 
  products, 
  autoPlay = true, 
  autoPlayInterval = 5000,
  className = '' 
}: OffersCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // عدد المنتجات المعروضة حسب حجم الشاشة
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 4;
    
    const width = window.innerWidth;
    if (width < 640) return 1; // موبايل
    if (width < 768) return 2; // تابلت صغير
    if (width < 1024) return 3; // تابلت
    return 4; // ديسكتوب
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  // تحديث عدد العناصر عند تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // التحكم في التشغيل التلقائي
  useEffect(() => {
    if (autoPlay && !isHovered && products.length > itemsPerView) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const maxIndex = Math.max(0, products.length - itemsPerView);
          return prevIndex >= maxIndex ? 0 : prevIndex + 1;
        });
      }, autoPlayInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isHovered, products.length, itemsPerView, autoPlayInterval]);

  // الانتقال للشريحة التالية
  const goToNext = () => {
    const maxIndex = Math.max(0, products.length - itemsPerView);
    setCurrentIndex((prevIndex) => 
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  };

  // الانتقال للشريحة السابقة
  const goToPrevious = () => {
    const maxIndex = Math.max(0, products.length - itemsPerView);
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? maxIndex : prevIndex - 1
    );
  };

  // الانتقال لشريحة محددة
  const goToSlide = (index: number) => {
    const maxIndex = Math.max(0, products.length - itemsPerView);
    setCurrentIndex(Math.min(index, maxIndex));
  };

  // إذا لم تكن هناك منتجات
  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-10 ${className}`}>
        <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
      </div>
    );
  }

  // إذا كان عدد المنتجات أقل من أو يساوي عدد العناصر المعروضة
  if (products.length <= itemsPerView) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <UnifiedProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  const maxIndex = Math.max(0, products.length - itemsPerView);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* منطقة العرض */}
      <div className="relative overflow-hidden" ref={carouselRef}>
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            width: `${(products.length / itemsPerView) * 100}%`
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / products.length}%` }}
            >
              <UnifiedProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* أزرار التنقل */}
      <button
        onClick={goToPrevious}
        className="absolute top-1/2 -translate-y-1/2 -left-4 z-10 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all hover:border-primary group"
        aria-label="السابق"
      >
        <ChevronLeft className="w-6 h-6 mx-auto text-gray-600 group-hover:text-primary" />
      </button>

      <button
        onClick={goToNext}
        className="absolute top-1/2 -translate-y-1/2 -right-4 z-10 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all hover:border-primary group"
        aria-label="التالي"
      >
        <ChevronRight className="w-6 h-6 mx-auto text-gray-600 group-hover:text-primary" />
      </button>

      {/* مؤشرات النقاط */}
      <div className="flex justify-center space-x-2 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary scale-110'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`الانتقال للشريحة ${index + 1}`}
          />
        ))}
      </div>

      {/* معلومات الشريحة الحالية */}
      <div className="text-center mt-4 text-sm text-gray-500">
        {currentIndex + 1} من {maxIndex + 1}
      </div>
    </div>
  );
};

export default OffersCarousel; 
