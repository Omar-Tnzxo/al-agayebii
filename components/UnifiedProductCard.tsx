'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  stock_quantity?: number;
  slug: string;
}

interface UnifiedProductCardProps {
  product: Product;
  className?: string;
}

export default function UnifiedProductCard({ product, className = '' }: UnifiedProductCardProps) {
  // حساب السعر بعد الخصم
  const discountedPrice = product.discount_percentage && product.discount_percentage > 0
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  const isDiscounted = product.discount_percentage && product.discount_percentage > 0;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all block ${className}`}
    >
      {/* صورة المنتج */}
      <div className="relative bg-gray-100 aspect-square">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <span className="text-4xl">📦</span>
          </div>
        )}

        {/* شارة الخصم */}
        {isDiscounted && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
            -{Math.round(product.discount_percentage || 0)}%
          </div>
        )}

        {/* شارة نفاذ المخزون */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">
              نفذت الكمية
            </span>
          </div>
        )}
      </div>

      {/* معلومات المنتج */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* التقييم */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
            {product.reviews_count && (
              <span className="text-xs text-gray-500">
                ({product.reviews_count})
              </span>
            )}
          </div>
        )}

        {/* السعر */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-primary">
            {discountedPrice.toLocaleString('ar-EG')} جنيه
          </span>
          {isDiscounted && (
            <span className="text-sm text-gray-400 line-through">
              {product.price.toLocaleString('ar-EG')} جنيه
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
