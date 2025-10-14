'use client';

import Link from 'next/link';
import Image from 'next/image';

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

export default function CategorySection({
  categories,
  title = 'تسوق حسب الفئة',
  subtitle = 'اختر الفئة المناسبة لاحتياجاتك'
}: CategorySectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 lg:py-16 bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4">
        {/* العنوان */}
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-cairo">
            {title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 font-tajawal">
            {subtitle}
          </p>
        </div>

        {/* شبكة الأصناف */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {categories.map((category) => {
            return (
              <Link
                key={category.id}
                href={`/category/${category.type}`}
                className="group flex flex-col items-center"
              >
                {/* صورة الصنف */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105 mb-3">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">📦</span>
                    </div>
                  )}
                </div>

                {/* اسم الصنف */}
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 text-center font-tajawal group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
