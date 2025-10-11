'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Filter,
  Check
} from 'lucide-react';

export interface DateRange {
  period: string;
  startDate?: string;
  endDate?: string;
  label: string;
}

interface DateRangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  isLoading?: boolean;
}

const predefinedRanges = [
  {
    period: 'all',
    label: 'جميع الأوقات',
    icon: BarChart3,
    description: 'منذ إنشاء المتجر'
  },
  {
    period: 'today',
    label: 'اليوم',
    icon: Clock,
    description: 'البيانات لليوم الحالي'
  },
  {
    period: 'yesterday',
    label: 'أمس',
    icon: Clock,
    description: 'البيانات ليوم أمس'
  },
  {
    period: 'week',
    label: 'آخر 7 أيام',
    icon: Calendar,
    description: 'البيانات لآخر أسبوع'
  },
  {
    period: 'lastWeek',
    label: 'الأسبوع الماضي',
    icon: Calendar,
    description: 'الأسبوع المنصرم كاملاً'
  },
  {
    period: 'month',
    label: 'آخر 30 يوم',
    icon: CalendarDays,
    description: 'البيانات لآخر شهر'
  },
  {
    period: 'lastMonth',
    label: 'الشهر الماضي',
    icon: CalendarDays,
    description: 'الشهر المنصرم كاملاً'
  },
  {
    period: 'quarter',
    label: 'الكوارتر الحالي',
    icon: TrendingUp,
    description: 'ربع السنة الحالي'
  },
  {
    period: 'lastQuarter',
    label: 'الكوارتر الماضي',
    icon: TrendingUp,
    description: 'ربع السنة المنصرم'
  },
  {
    period: '6months',
    label: 'آخر 6 شهور',
    icon: BarChart3,
    description: 'البيانات لآخر نصف سنة'
  }
];

export default function DateRangeSelector({ selectedRange, onRangeChange, isLoading }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRangeSelect = (range: typeof predefinedRanges[0]) => {
    onRangeChange({
      period: range.period,
      label: range.label
    });
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      onRangeChange({
        period: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
        label: `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
      });
      setIsOpen(false);
      setShowCustom(false);
    }
  };

  const formatDate = (dateString: string) => {
    // استخدام تنسيق بسيط لتجنب مشاكل الhydration
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const getCurrentRangeIcon = () => {
    const range = predefinedRanges.find(r => r.period === selectedRange.period);
    if (range) {
      const Icon = range.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Calendar className="h-4 w-4" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl
          hover:border-blue-300 hover:shadow-sm transition-all duration-200
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-blue-400 shadow-md' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded-md text-blue-600">
            {getCurrentRangeIcon()}
          </div>
          <span className="font-medium text-gray-700">{selectedRange.label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              اختر الفترة الزمنية
            </h3>
            <p className="text-sm text-gray-600 mt-1">حدد الفترة لعرض البيانات</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!showCustom ? (
              <div className="p-2">
                {predefinedRanges.map((range) => {
                  const Icon = range.icon;
                  const isSelected = selectedRange.period === range.period;

                  return (
                    <button
                      key={range.period}
                      onClick={() => handleRangeSelect(range)}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-lg transition-all
                        ${isSelected
                          ? 'bg-blue-50 border border-blue-200 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{range.label}</div>
                          <div className="text-xs text-gray-500">{range.description}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  );
                })}

                {/* خيار التاريخ المخصص */}
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"
                >
                  <div className="p-2 bg-purple-100 rounded-md">
                    <CalendarDays className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="font-medium">فترة مخصصة</div>
                    <div className="text-xs text-gray-500">اختر تاريخ محدد</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ←
                  </button>
                  <h4 className="font-medium text-gray-900">اختر فترة مخصصة</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      من تاريخ
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      إلى تاريخ
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCustom(false)}
                      className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleCustomRangeApply}
                      disabled={!customStartDate || !customEndDate}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}