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

  // الانتقال لصورة محددة
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

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
      <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Image
          src={slide.image_url}
          alt="Hero Image"
          fill
          className="object-contain"
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
      className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 group"
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
              className="object-contain"
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

        {/* أزرار التنقل */}
        <button
          onClick={prevSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
          aria-label="السابق"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
          aria-label="التالي"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
        </button>

        {/* المؤشرات (Dots) */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentSlide
                  ? 'w-8 md:w-10 h-2 md:h-3 bg-white rounded-full'
                  : 'w-2 md:w-3 h-2 md:h-3 bg-white/50 hover:bg-white/75 rounded-full'
              }`}
              aria-label={`الانتقال إلى الصورة ${index + 1}`}
            />
          ))}
        </div>

      {/* شريط التقدم (اختياري) */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: '100%',
              animation: `progress ${(slides[currentSlide]?.duration || 5)}s linear`
            }}
          />
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
