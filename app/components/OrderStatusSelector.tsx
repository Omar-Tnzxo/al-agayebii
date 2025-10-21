'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, CheckCircle, X, Package, Truck, CheckCircle2, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'replacement_requested' | 'replaced' | 'returned' | 'cancelled';

interface OrderStatusSelectorProps {
  currentStatus: OrderStatus;
  orderId: string;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'pending', label: 'في الانتظار', icon: Clock, color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 'confirmed', label: 'مؤكد', icon: CheckCircle, color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  { value: 'shipped', label: 'تم الشحن', icon: Truck, color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
  { value: 'delivered', label: 'تم التسليم', icon: CheckCircle2, color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { value: 'replacement_requested', label: 'طلب استبدال', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { value: 'replaced', label: 'تم الاستبدال', icon: RefreshCw, color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
  { value: 'returned', label: 'مرتجع', icon: RotateCcw, color: 'bg-red-100 text-red-800 hover:bg-red-200' },
  { value: 'cancelled', label: 'ملغي', icon: X, color: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
];

export default function OrderStatusSelector({
  currentStatus,
  orderId,
  onStatusChange,
  disabled = false
}: OrderStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus);
  const CurrentIcon = currentStatusOption?.icon || Clock;

  // تحديد موضع القائمة (افتح دائماً للأعلى في جداول الطلبات)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      // افتح دائماً للأعلى في جداول الطلبات
      setDropdownPosition('top');
    }
  }, [isOpen]);

  const handleStatusSelect = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating || disabled) return;

    setIsUpdating(true);
    setIsOpen(false);

    try {
      await onStatusChange(orderId, newStatus);
    } catch (error) {
      console.error('خطأ في تحديث الحالة:', error);
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
            'fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl py-1 min-w-[140px] max-h-[320px] overflow-y-auto',
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
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === currentStatus;

              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  disabled={isSelected}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-right',
                    isSelected
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="mr-auto text-green-500">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}