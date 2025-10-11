'use client';

import { useState, useEffect } from 'react';
import { Truck, ChevronDown, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';
import { 
  getShippingSettings,
  calculateShipping,
  type ShippingSettings,
  type ShippingCalculation
} from '@/lib/store/shipping';

interface SimpleShippingSelectorProps {
  subtotal: number;
  currency?: string;
  className?: string;
  onShippingChange?: (calculation: ShippingCalculation) => void;
}

export function SimpleShippingSelector({
  subtotal,
  currency = 'ج.م',
  className = '',
  onShippingChange
}: SimpleShippingSelectorProps) {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [calculation, setCalculation] = useState<ShippingCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // جلب إعدادات الشحن وحساب التكلفة
  useEffect(() => {
    async function fetchShippingData() {
      try {
        setIsLoading(true);
        const shippingSettings = await getShippingSettings();
        const shippingCalculation = await calculateShipping(subtotal);
        
        setSettings(shippingSettings);
        setCalculation(shippingCalculation);
        
        // إرسال البيانات للمكون الأب
        if (onShippingChange) {
          onShippingChange(shippingCalculation);
        }
      } catch (error) {
        console.error('خطأ في جلب إعدادات الشحن:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchShippingData();
  }, [subtotal, onShippingChange]);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-accent/20 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!settings || !calculation) {
    return null;
  }

  // إذا كان الشحن معطل
  if (calculation.type === 'disabled') {
    return (
      <div className={`p-3 bg-gray-100 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">{calculation.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-white border border-accent/20 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <div>
            <div className="text-sm font-medium text-primary">
              {settings.company_name}
            </div>
            {calculation.delivery_time && (
              <div className="text-xs text-accent/60">
                ⏱️ {calculation.delivery_time}
              </div>
            )}
          </div>
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-primary">
            {calculation.type === 'free' ? (
              <span className="text-green-600">مجاني</span>
            ) : calculation.type === 'phone' ? (
              <span className="text-amber-600">يحدد هاتفياً</span>
            ) : (
              `${formatPrice(calculation.cost)} ${currency}`
            )}
          </div>
          {calculation.message && calculation.type === 'phone' && (
            <div className="text-xs text-amber-600 mt-1">
              {calculation.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}