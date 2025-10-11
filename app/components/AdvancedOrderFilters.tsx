'use client';

import { useState, useEffect } from 'react';
import {
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  Truck,
  X,
  ChevronDown,
  Save,
  RefreshCw,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

export interface FilterState {
  search: string;
  status: string;
  paymentStatus: string;
  dateRange: {
    from: string;
    to: string;
    preset: string;
  };
  amountRange: {
    min: string;
    max: string;
  };
  governorate: string;
  shippingCompany: string;
  paymentMethod: string;
  hasProfit: string; // 'all' | 'profitable' | 'loss'
}

interface AdvancedOrderFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'pending', label: 'في الانتظار' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'replacement_requested', label: 'طلب استبدال' },
  { value: 'replaced', label: 'تم الاستبدال' },
  { value: 'returned', label: 'مرتجع' },
  { value: 'cancelled', label: 'ملغي' }
];

const paymentStatusOptions = [
  { value: 'all', label: 'كل الدفع' },
  { value: 'pending', label: 'في انتظار الدفع' },
  { value: 'cash_on_delivery', label: 'دفع عند الاستلام' },
  { value: 'collected', label: 'تم التحصيل' },
  { value: 'refund_pending', label: 'في انتظار الإرجاع' },
  { value: 'refunded', label: 'تم الإرجاع' }
];

const datePresets = [
  { value: 'all', label: 'كل الأوقات' },
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'thisWeek', label: 'هذا الأسبوع' },
  { value: 'lastWeek', label: 'الأسبوع الماضي' },
  { value: 'thisMonth', label: 'هذا الشهر' },
  { value: 'lastMonth', label: 'الشهر الماضي' },
  { value: 'custom', label: 'تخصيص' }
];

const profitOptions = [
  { value: 'all', label: 'كل الطلبات' },
  { value: 'profitable', label: 'طلبات مربحة' },
  { value: 'loss', label: 'طلبات خاسرة' }
];

const governoratesOptions = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية',
  'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف',
  'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
  'شمال سيناء', 'سوهاج', 'البحر الأحمر'
];

export default function AdvancedOrderFilters({
  filters,
  onFiltersChange,
  onReset,
  isLoading = false
}: AdvancedOrderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedFilters, setSavedFilters] = useState<{[key: string]: FilterState}>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  // تحميل الفلاتر المحفوظة من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('orderFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('خطأ في تحميل الفلاتر المحفوظة:', error);
      }
    }
  }, []);

  // حفظ الفلاتر في localStorage
  const saveFilters = () => {
    if (!saveFilterName.trim()) return;

    const newSavedFilters = {
      ...savedFilters,
      [saveFilterName]: filters
    };

    setSavedFilters(newSavedFilters);
    localStorage.setItem('orderFilters', JSON.stringify(newSavedFilters));
    setSaveFilterName('');
    setShowSaveDialog(false);
  };

  // تطبيق فلتر محفوظ
  const applySavedFilter = (filterName: string) => {
    const savedFilter = savedFilters[filterName];
    if (savedFilter) {
      onFiltersChange(savedFilter);
    }
  };

  // حذف فلتر محفوظ
  const deleteSavedFilter = (filterName: string) => {
    const newSavedFilters = { ...savedFilters };
    delete newSavedFilters[filterName];
    setSavedFilters(newSavedFilters);
    localStorage.setItem('orderFilters', JSON.stringify(newSavedFilters));
  };

  // تحديث فلتر واحد
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // تحديث نطاق التاريخ
  const updateDateRange = (key: keyof FilterState['dateRange'], value: string) => {
    updateFilter('dateRange', {
      ...filters.dateRange,
      [key]: value
    });
  };

  // تحديث نطاق المبلغ
  const updateAmountRange = (key: keyof FilterState['amountRange'], value: string) => {
    updateFilter('amountRange', {
      ...filters.amountRange,
      [key]: value
    });
  };

  // تطبيق preset للتاريخ
  const applyDatePreset = (preset: string) => {
    const today = new Date();
    let from = '';
    let to = '';

    switch (preset) {
      case 'today':
        from = to = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        from = to = yesterday.toISOString().split('T')[0];
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        from = startOfWeek.toISOString().split('T')[0];
        to = today.toISOString().split('T')[0];
        break;
      case 'lastWeek':
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        from = lastWeekStart.toISOString().split('T')[0];
        to = lastWeekEnd.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        to = today.toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        from = lastMonth.toISOString().split('T')[0];
        to = lastMonthEnd.toISOString().split('T')[0];
        break;
      default:
        from = to = '';
    }

    updateFilter('dateRange', {
      preset,
      from,
      to
    });
  };

  // تحقق من وجود فلاتر نشطة
  const hasActiveFilters = () => {
    return filters.search ||
           filters.status !== 'all' ||
           filters.paymentStatus !== 'all' ||
           filters.dateRange.preset !== 'all' ||
           filters.amountRange.min ||
           filters.amountRange.max ||
           filters.governorate ||
           filters.shippingCompany ||
           filters.paymentMethod ||
           filters.hasProfit !== 'all';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">فلاتر البحث المتقدم</h3>
            <p className="text-sm text-gray-500">
              {hasActiveFilters() ? 'يوجد فلاتر نشطة' : 'لا توجد فلاتر مطبقة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تعيين
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
              isExpanded
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Filter className="w-4 h-4" />
            {isExpanded ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </button>
        </div>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* الصف الأول: البحث والحالات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث في الطلبات</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="رقم الطلب، اسم العميل، أو رقم الهاتف..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حالة الطلب</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حالة الدفع</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => updateFilter('paymentStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {paymentStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* الصف الثاني: التاريخ */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">فلترة حسب التاريخ</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">فترة زمنية</label>
                <select
                  value={filters.dateRange.preset}
                  onChange={(e) => applyDatePreset(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {datePresets.map(preset => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) => updateDateRange('from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) => updateDateRange('to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* الصف الثالث: المبلغ والربح */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">فلترة حسب المبلغ والربح</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">أقل مبلغ (ج.م)</label>
                <input
                  type="number"
                  value={filters.amountRange.min}
                  onChange={(e) => updateAmountRange('min', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">أعلى مبلغ (ج.م)</label>
                <input
                  type="number"
                  value={filters.amountRange.max}
                  onChange={(e) => updateAmountRange('max', e.target.value)}
                  placeholder="∞"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">حالة الربح</label>
                <select
                  value={filters.hasProfit}
                  onChange={(e) => updateFilter('hasProfit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {profitOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* الصف الرابع: الموقع والشحن */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">فلترة حسب الموقع والشحن</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                <select
                  value={filters.governorate}
                  onChange={(e) => updateFilter('governorate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">كل المحافظات</option>
                  {governoratesOptions.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شركة الشحن</label>
                <input
                  type="text"
                  value={filters.shippingCompany}
                  onChange={(e) => updateFilter('shippingCompany', e.target.value)}
                  placeholder="اسم شركة الشحن..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                <input
                  type="text"
                  value={filters.paymentMethod}
                  onChange={(e) => updateFilter('paymentMethod', e.target.value)}
                  placeholder="طريقة الدفع..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* الفلاتر المحفوظة */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-gray-900">الفلاتر المحفوظة</h4>
              </div>

              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Save className="w-4 h-4" />
                حفظ الفلتر الحالي
              </button>
            </div>

            {Object.keys(savedFilters).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.keys(savedFilters).map(filterName => (
                  <div key={filterName} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-2">
                    <button
                      onClick={() => applySavedFilter(filterName)}
                      className="text-sm text-gray-700 hover:text-blue-600"
                    >
                      {filterName}
                    </button>
                    <button
                      onClick={() => deleteSavedFilter(filterName)}
                      className="text-gray-400 hover:text-red-600 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">لا توجد فلاتر محفوظة</p>
            )}
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">حفظ الفلتر</h3>
                <input
                  type="text"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  placeholder="اسم الفلتر..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={saveFilters}
                    disabled={!saveFilterName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}