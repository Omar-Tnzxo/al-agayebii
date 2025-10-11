'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star } from 'lucide-react';
import { useState } from 'react';

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
          <ProductCard key={product.id} product={product} />
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
            <ProductCard key={product.id} product={product} />
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

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col shadow-sm"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.images[0] || '/placeholder.png'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-col gap-1 sm:gap-1.5">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
              -{discount}%
            </span>
          )}
          {product.badge && (
            <span className="bg-primary text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
              {product.badge}
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-800 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
              نفذ
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-accent mb-1 sm:mb-2 line-clamp-2 font-tajawal group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 ${
                    i < Math.floor(product.rating!)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {product.reviewCount && (
              <span className="text-[10px] sm:text-xs text-accent/60 mr-0.5 sm:mr-1">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-primary font-tajawal">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs md:text-sm text-accent/50 line-through font-tajawal">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
