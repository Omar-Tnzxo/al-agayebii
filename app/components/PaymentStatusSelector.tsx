'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, CheckCircle, X, ArrowUpDown, CreditCard, TrendingUp, Ban, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

type PaymentStatus = 'pending' | 'cash_on_delivery' | 'collected' | 'refund_pending' | 'refunded';
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'replacement_requested' | 'replaced' | 'returned' | 'cancelled';

interface PaymentStatusSelectorProps {
  currentStatus: PaymentStatus;
  orderId: string;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  disabled?: boolean;
  orderStatus?: OrderStatus;
}

const paymentStatusOptions = [
  { value: 'pending', label: 'في الانتظار', icon: Clock, color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 'cash_on_delivery', label: 'دفع عند الاستلام', icon: CreditCard, color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  { value: 'collected', label: 'تم التحصيل', icon: TrendingUp, color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { value: 'refund_pending', label: 'في انتظار الإرجاع', icon: Clock, color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { value: 'refunded', label: 'تم الإرجاع', icon: ArrowUpDown, color: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
];

// دالة لتحديد الخيارات المتاحة بناءً على حالة الطلب
// دالة لتحويل حالة الطلب إلى نص واضح
const getOrderStatusLabel = (orderStatus: string): string => {
  const orderStatusLabels: Record<string, string> = {
    'pending': 'في الانتظار',
    'confirmed': 'مؤكد',
    'shipped': 'تم الشحن',
    'delivered': 'تم التسليم',
    'replacement_requested': 'طلب استبدال',
    'replaced': 'تم الاستبدال',
    'returned': 'مرتجع',
    'cancelled': 'ملغي'
  };
  return orderStatusLabels[orderStatus] || orderStatus;
};

const getAvailablePaymentStatuses = (orderStatus?: string): string[] => {
  switch (orderStatus) {
    case 'pending':
      return ['pending'];
    case 'confirmed':
      return ['pending'];
    case 'shipped':
      return ['pending', 'cash_on_delivery'];
    case 'delivered':
      return ['cash_on_delivery', 'collected'];
    case 'replacement_requested':
      return ['cash_on_delivery', 'collected', 'refund_pending'];
    case 'replaced':
      return ['pending', 'cash_on_delivery'];
    case 'returned':
      return ['refund_pending', 'refunded'];
    case 'cancelled':
      return ['pending', 'refunded'];
    default:
      // إذا لم يتم تمرير حالة الطلب، السماح بجميع الخيارات المصرية
      return ['pending', 'cash_on_delivery', 'collected', 'refund_pending', 'refunded'];
  }
};

export default function PaymentStatusSelector({
  currentStatus,
  orderId,
  onStatusChange,
  disabled = false,
  orderStatus
}: PaymentStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentStatusOption = paymentStatusOptions.find(option => option.value === currentStatus);
  const CurrentIcon = currentStatusOption?.icon || Clock;

  // الحصول على الخيارات المتاحة بناءً على حالة الطلب
  const availableStatuses = getAvailablePaymentStatuses(orderStatus);

  // تحديد موضع القائمة (أعلى أو أسفل) بناءً على المساحة المتاحة
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      
      // ارتفاع القائمة المتوقع (5 عناصر × 40px تقريباً)
      const dropdownHeight = 250;
      
      // المسافة المطلوبة للأمان
      const safetyBuffer = 20;

      // قرار ذكي محسّن: افتح للأعلى إذا كانت المساحة أسفلاً قليلة
      if (spaceBelow < dropdownHeight + safetyBuffer) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);
  const availableOptions = paymentStatusOptions.filter(option =>
    availableStatuses.includes(option.value)
  );

  const handleStatusSelect = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating || disabled) return;

    setIsUpdating(true);
    setIsOpen(false);

    try {
      await onStatusChange(orderId, newStatus);
    } catch (error) {
      console.error('خطأ في تحديث حالة الدفع:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = () => {
    if (!disabled && !isUpdating) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled || isUpdating}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all',
          currentStatusOption?.color,
          !disabled && !isUpdating && 'cursor-pointer',
          disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm',
          'group'
        )}
      >
        {isUpdating ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <CurrentIcon className="w-4 h-4" />
        )}
        <span>{currentStatusOption?.label}</span>
        {!disabled && !isUpdating && (
          <ChevronDown className={cn(
            'w-3 h-3 transition-transform',
            isOpen && 'rotate-180'
          )} />
        )}
      </button>

      {isOpen && !disabled && !isUpdating && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className={cn(
            'fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl py-1 min-w-[120px] max-h-[250px] overflow-y-auto',
            dropdownPosition === 'bottom' && 'mt-1',
            dropdownPosition === 'top' && 'mb-1'
          )}
          style={{
            left: buttonRef.current ? `${buttonRef.current.getBoundingClientRect().left}px` : 0,
            [dropdownPosition === 'bottom' ? 'top' : 'bottom']: buttonRef.current 
              ? dropdownPosition === 'bottom'
                ? `${buttonRef.current.getBoundingClientRect().bottom + 4}px`
                : `${window.innerHeight - buttonRef.current.getBoundingClientRect().top + 4}px`
              : 0
          }}
          >
            {availableOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === currentStatus;
              const isAvailable = availableStatuses.includes(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  disabled={isSelected || !isAvailable}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-right',
                    isSelected
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
                      : isAvailable
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="mr-auto text-green-500">✓</span>
                  )}
                  {!isAvailable && !isSelected && (
                    <span className="mr-auto text-gray-400">🚫</span>
                  )}
                </button>
              );
            })}

            {/* رسالة توضيحية إذا كانت الخيارات محدودة */}
            {orderStatus && availableOptions.length < paymentStatusOptions.length && (
              <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
                الخيارات محدودة بحالة الطلب: {getOrderStatusLabel(orderStatus)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}