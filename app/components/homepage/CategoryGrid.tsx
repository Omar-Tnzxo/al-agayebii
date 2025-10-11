'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Zap, Wrench, Hammer, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'electrical' | 'plumbing' | 'tools' | 'other';
  image?: string;
  productCount?: number;
}

interface CategorySectionProps {
  categories: Category[];
  title?: string;
  subtitle?: string;
}

const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'electrical':
      return Zap;
    case 'plumbing':
      return Wrench;
    case 'tools':
      return Hammer;
    default:
      return Sparkles;
  }
};

const getCategoryGradient = (type: string) => {
  switch (type) {
    case 'electrical':
      return 'from-yellow-500/80 to-orange-500/80';
    case 'plumbing':
      return 'from-blue-500/80 to-cyan-500/80';
    case 'tools':
      return 'from-gray-700/80 to-gray-900/80';
    default:
      return 'from-primary/80 to-accent/80';
  }
};

export default function CategorySection({
  categories,
  title = 'تسوق حسب الفئة',
  subtitle = 'اختر الفئة المناسبة لاحتياجاتك'
}: CategorySectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-3 sm:px-4">
        {/* العنوان */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2 font-tajawal">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-accent/70 font-tajawal">
            {subtitle}
          </p>
        </div>

        {/* شبكة الفئات */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.type);
            const gradient = getCategoryGradient(category.type);

            return (
              <Link
                key={category.id}
                href={`/category/${category.type}`}
                className="group relative overflow-hidden rounded-xl aspect-square hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* الصورة الخلفية */}
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                )}

                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${gradient} group-hover:opacity-90 transition-opacity`} />

                {/* المحتوى */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3 sm:p-4">
                  {/* الأيقونة */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  </div>

                  {/* اسم الفئة */}
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-center font-tajawal mb-1">
                    {category.name}
                  </h3>

                  {/* عدد المنتجات */}
                  {category.productCount !== undefined && (
                    <p className="text-xs sm:text-sm text-white/90 font-tajawal">
                      {category.productCount} منتج
                    </p>
                  )}

                  {/* أيقونة السهم */}
                  <div className="mt-1 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
