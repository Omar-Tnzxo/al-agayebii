'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Truck, Gift } from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    discount_percentage?: number | null;
    discount_price?: number | null;
  };
}

interface EnhancedOrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  totalDiscount: number;
  shippingFee: number;
  total: number;
  currency: string;
  freeShippingThreshold?: number;
  freeShippingEnabled?: boolean;
  shippingType?: 'fixed' | 'free' | 'phone' | 'pickup' | 'disabled';
  shippingMessage?: string;
}

export default function EnhancedOrderSummary({
  cartItems,
  subtotal,
  totalDiscount,
  shippingFee,
  total,
  currency,
  freeShippingThreshold = 500,
  freeShippingEnabled = true,
  shippingType = 'fixed',
  shippingMessage = ''
}: EnhancedOrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const remainingForFreeShipping = freeShippingThreshold - subtotal;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;

  // Check if shipping/pickup is completely disabled
  const isShippingCompletelyDisabled = shippingType === 'disabled' && shippingMessage?.includes('معطلة حالياً');

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            ملخص الطلب
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span className="text-sm font-medium">
              {isExpanded ? 'إخفاء' : 'عرض'} التفاصيل
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Items List */}
      {isExpanded && (
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-4">
            {cartItems.map((item) => {
              const price = item.product.discount_price || item.product.price;
              const originalPrice = item.product.price;
              const hasDiscount = item.product.discount_price && item.product.discount_price < originalPrice;

              return (
                <div key={item.id} className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {item.quantity}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {hasDiscount && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(originalPrice)} {currency}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-blue-600">
                        {formatPrice(price)} {currency}
                      </span>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatPrice(price * item.quantity)} {currency}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Calculations */}
      <div className="p-6 space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">المجموع الفرعي</span>
          <span className="font-semibold">
            {formatPrice(subtotal + totalDiscount)} {currency}
          </span>
        </div>

        {/* Discount */}
        {totalDiscount > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span className="flex items-center gap-1">
              <Gift className="w-4 h-4" />
              الخصم
            </span>
            <span className="font-semibold">
              -{formatPrice(totalDiscount)} {currency}
            </span>
          </div>
        )}

        {/* Shipping - Only show if not completely disabled */}
        {!isShippingCompletelyDisabled && (
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-gray-600">
              <Truck className="w-4 h-4" />
              الشحن
            </span>
            <span className={`font-semibold ${
              shippingType === 'free' ? 'text-green-600' :
              shippingType === 'pickup' ? 'text-green-600' :
              shippingType === 'phone' ? 'text-orange-600' :
              shippingType === 'disabled' ? 'text-gray-500' :
              ''
            }`}>
              {shippingType === 'disabled' ? (
                'استلام من الفرع فقط'
              ) : shippingType === 'phone' ? (
                'يحدد هاتفياً'
              ) : shippingType === 'pickup' ? (
                'استلام من الفرع'
              ) : shippingType === 'free' || shippingFee === 0 ? (
                <span className="flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  مجاني
                </span>
              ) : (
                `${formatPrice(shippingFee)} ${currency}`
              )}
            </span>
          </div>
        )}

        {/* Free Shipping Progress - Only show if shipping is enabled and not completely disabled */}
        {!isShippingCompletelyDisabled && freeShippingEnabled && !qualifiesForFreeShipping && remainingForFreeShipping > 0 && shippingType !== 'free' && shippingType !== 'disabled' && shippingType !== 'pickup' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-800">
                أضف {formatPrice(remainingForFreeShipping)} {currency} للحصول على شحن مجاني
              </span>
            </div>
            <div className="mt-2 bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Free Shipping Achieved - Only show when actually free, not completely disabled */}
        {!isShippingCompletelyDisabled && (qualifiesForFreeShipping && freeShippingEnabled || shippingType === 'free') && shippingType !== 'disabled' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">
                مبروك! حصلت على شحن مجاني 🎉
              </span>
            </div>
          </div>
        )}

        {/* Shipping Message - Show for phone or disabled (but not completely disabled) */}
        {!isShippingCompletelyDisabled && shippingMessage && (shippingType === 'phone' || shippingType === 'disabled') && (
          <div className={`rounded-lg p-3 ${
            shippingType === 'phone' ? 'bg-orange-50 border border-orange-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <Truck className={`w-4 h-4 ${shippingType === 'phone' ? 'text-orange-600' : 'text-gray-600'}`} />
              <span className={shippingType === 'phone' ? 'text-orange-800' : 'text-gray-700'}>
                {shippingMessage}
              </span>
            </div>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">المجموع الإجمالي</span>
          <span className="text-xl font-bold text-blue-600">
            {formatPrice(total)} {currency}
          </span>
        </div>

        {/* Tax Note */}
        <p className="text-xs text-gray-500 text-center">
          جميع الأسعار شاملة الضرائب المطبقة
        </p>
      </div>
    </div>
  );
}