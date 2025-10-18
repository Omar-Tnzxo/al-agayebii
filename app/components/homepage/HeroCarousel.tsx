'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  image_url: string;
  link_url?: string;
  duration?: number;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // الانتقال للصورة التالية
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // الانتقال للصورة السابقة
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const duration = (slides[currentSlide]?.duration || 5) * 1000;
    const timer = setInterval(nextSlide, duration);

    return () => clearInterval(timer);
  }, [currentSlide, slides, isPaused, nextSlide]);

  if (!slides || slides.length === 0) {
    return null;
  }

  // إذا كانت صورة واحدة فقط
  if (slides.length === 1) {
    const slide = slides[0];
    const content = (
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] lg:aspect-[3/1] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Image
          src={slide.image_url}
          alt="Hero Image"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
    );

    if (slide.link_url) {
      return (
        <Link href={slide.link_url} className="block cursor-pointer">
          {content}
        </Link>
      );
    }

    return <section>{content}</section>;
  }

  return (
    <section
      className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] lg:aspect-[3/1] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* الصور */}
      {slides.map((slide, index) => {
        const slideContent = (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={slide.image_url}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        );

        if (slide.link_url && index === currentSlide) {
          return (
            <Link href={slide.link_url} key={slide.id} className="cursor-pointer block absolute inset-0 z-20">
              {slideContent}
            </Link>
          );
        }

        return slideContent;
      })}

      {/* أزرار التنقل - دائماً مرئية على جميع الأجهزة */}
      <button
        onClick={prevSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-sm"
        aria-label="السابق"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-800" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-sm"
        aria-label="التالي"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-800" />
      </button>
    </section>
  );
}
