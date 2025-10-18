'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import UnifiedProductCard from '@/components/UnifiedProductCard';

// Helper functions
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const calculateDiscount = (original: number, current: number) => {
  return Math.round(((original - current) / original) * 100);
};

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  badge?: string;
}

interface SectionSettings {
  product_source: 'best_sellers' | 'new' | 'deals' | 'category' | 'manual';
  category_type?: string;
  product_count: number;
  layout: 'grid' | 'slider';
  columns: number;
  show_view_all: boolean;
}

interface DynamicProductSectionProps {
  sectionId: string;
  title: string;
  subtitle?: string;
  settings: SectionSettings;
  products: Product[];
  viewAllLink?: string;
}

export default function DynamicProductSection({
  title,
  subtitle,
  settings,
  products,
  viewAllLink
}: DynamicProductSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!products || products.length === 0) {
    return null;
  }

  // Grid Layout
  const GridLayout = () => {
    const gridCols = {
      2: 'grid-cols-2',
      3: 'sm:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'xl:grid-cols-5',
      6: 'xl:grid-cols-6'
    };

    return (
      <div className={`grid ${gridCols[2]} ${gridCols[3]} ${settings.columns >= 4 ? gridCols[settings.columns as keyof typeof gridCols] : ''} gap-3 sm:gap-4 md:gap-6`}>
        {products.slice(0, settings.product_count).map((product) => (
          <UnifiedProductCard 
            key={product.id} 
            product={{
              ...product,
              image: product.images[0],
              discount_percentage: product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0,
              stock_quantity: product.inStock ? 1 : 0
            }} 
          />
        ))}
      </div>
    );
  };

  // Slider Layout
  const SliderLayout = () => {
    const slidesPerView = settings.columns || 4;
    const totalSlides = Math.ceil(products.length / slidesPerView);

    const nextSlide = () => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const visibleProducts = products.slice(
      currentSlide * slidesPerView,
      (currentSlide + 1) * slidesPerView
    );

    return (
      <div className="relative">
        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all hover:scale-110"
              aria-label="السابق"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all hover:scale-110"
              aria-label="التالي"
            >
              <ArrowLeft className="w-5 h-5 text-primary rotate-180" />
            </button>
          </>
        )}

        {/* Products Grid */}
        <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(slidesPerView, 3)} lg:grid-cols-${slidesPerView} gap-3 sm:gap-4 md:gap-6`}>
          {visibleProducts.map((product) => (
            <UnifiedProductCard 
              key={product.id} 
              product={{
                ...product,
                image: product.images[0],
                discount_percentage: product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0,
                stock_quantity: product.inStock ? 1 : 0
              }} 
            />
          ))}
        </div>

        {/* Dots Indicator */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-6 sm:w-8 bg-primary'
                    : 'w-1.5 sm:w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`الانتقال إلى الشريحة ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="py-8 md:py-12 lg:py-16 bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-1 font-tajawal">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-accent/70 font-tajawal">
                {subtitle}
              </p>
            )}
          </div>

          {/* View All Button */}
          {settings.show_view_all && viewAllLink && (
            <Link
              href={viewAllLink}
              className="flex items-center gap-1 sm:gap-2 text-primary hover:text-primary/80 transition-colors font-tajawal group flex-shrink-0"
            >
              <span className="text-xs sm:text-sm md:text-base font-medium">عرض الكل</span>
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Products Layout */}
        {settings.layout === 'slider' ? <SliderLayout /> : <GridLayout />}
      </div>
    </section>
  );
}

