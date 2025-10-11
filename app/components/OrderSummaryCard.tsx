import { FC } from 'react';
import { ShoppingCart, Percent, Truck, Receipt, CheckCircle, Info, Gift } from 'lucide-react';
import clsx from 'clsx';

interface OrderSummaryCardProps {
  subTotal: number;
  discount?: number;
  shipping: number;
  tax?: number;
  total: number;
  currency?: string; // اجعلها اختيارية مع قيمة افتراضية
  freeShippingEnabled: boolean;
  freeShippingMessage?: string;
  shippingType?: 'fixed' | 'free' | 'phone' | 'pickup' | 'disabled';
  shippingMessage?: string;
  cta?: React.ReactNode;
  className?: string;
}

export const OrderSummaryCard: FC<OrderSummaryCardProps> = ({
  subTotal,
  discount = 0,
  shipping,
  tax = 0,
  total,
  currency = 'ج.م',
  freeShippingEnabled,
  freeShippingMessage,
  shippingType = 'fixed',
  shippingMessage,
  cta,
  className = '',
}) => {
  // Check if shipping/pickup is completely disabled
  const isShippingCompletelyDisabled = shippingType === 'disabled' && shippingMessage?.includes('معطلة حالياً');

  return (
    <section
      className={clsx(
        'w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-3 md:p-4 border border-accent/10',
        'flex flex-col gap-3',
        className
      )}
      dir="rtl"
      aria-label="ملخص الطلب"
    >
      <h2 className="font-bold text-lg mb-1 flex items-center gap-2 text-primary">
        <Receipt className="w-5 h-5 text-primary" />
        ملخص الطلب
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-accent/80">
            <ShoppingCart className="w-4 h-4 text-accent/60" />
            إجمالي المنتجات
          </span>
          <span className="font-bold">{subTotal.toLocaleString()} {currency}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-green-700">
              <Percent className="w-4 h-4 text-green-500" />
              الخصم
            </span>
            <span className="font-bold text-green-600">-{discount.toLocaleString()} {currency}</span>
          </div>
        )}
        {/* Only show shipping section if not completely disabled */}
        {!isShippingCompletelyDisabled && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-blue-700">
                <Truck className="w-4 h-4 text-blue-400" />
                الشحن
              </span>
              <span className={clsx(
                'font-bold',
                shippingType === 'free' && 'text-green-600',
                shippingType === 'phone' && 'text-orange-600',
                shippingType === 'disabled' && 'text-gray-500',
                shippingType === 'fixed' && shipping > 0 && 'text-gray-900'
              )}>
                {shippingType === 'free' ? (
                  <span className="flex items-center gap-1">
                    <Gift className="w-4 h-4" />
                    مجاني
                  </span>
                ) : shippingType === 'phone' ? (
                  'يحدد هاتفياً'
                ) : shippingType === 'disabled' ? (
                  'غير متاح'
                ) : shippingType === 'pickup' ? (
                  'استلام من الفرع'
                ) : (
                  `${shipping.toLocaleString()} ${currency}`
                )}
              </span>
            </div>
            {shippingMessage && shippingType !== 'fixed' && (
              <div className={clsx(
                'text-xs px-2 py-1 rounded-md',
                shippingType === 'free' && 'bg-green-50 text-green-700',
                shippingType === 'phone' && 'bg-orange-50 text-orange-700',
                shippingType === 'disabled' && 'bg-gray-50 text-gray-600'
              )}>
                {shippingMessage}
              </div>
            )}
          </>
        )}
        {tax > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-accent/70">
              <Info className="w-4 h-4 text-accent/40" />
              الضرائب
            </span>
            <span className="font-bold">{tax.toLocaleString()} {currency}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-base mt-1">
          <span className="font-bold text-accent">الإجمالي النهائي</span>
          <span className="text-lg font-extrabold text-primary">{total.toLocaleString()} {currency}</span>
        </div>
      </div>
      {freeShippingMessage && (
        <div className={clsx(
          'mt-1 rounded-lg px-2 py-1 flex items-center gap-1 text-xs',
          freeShippingEnabled
            ? 'bg-green-50 text-green-700'
            : 'bg-blue-50 text-blue-600'
        )}>
          {freeShippingEnabled ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Truck className="w-4 h-4 text-blue-400" />
          )}
          {freeShippingMessage}
        </div>
      )}
      {cta && <div className="mt-2">{cta}</div>}
    </section>
  );
}; 