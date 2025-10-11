'use client';

import { useState } from 'react';
import { 
  Grid3X3, 
  List, 
  ChevronDown, 
  SortAsc, 
  SortDesc, 
  Filter,
  Search,
  X,
  ArrowUpDown,
  DollarSign,
  Star,
  Calendar,
  TrendingUp,
  Package,
  Eye,
  Heart
} from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
  icon?: any;
  direction?: 'asc' | 'desc';
}

interface ProductSortBarProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount: number;
  totalCount?: number;
  isLoading?: boolean;
  onFilterToggle?: () => void;
  showFilters?: boolean;
  className?: string;
}

const sortOptions: SortOption[] = [
  { value: 'featured', label: 'المميزة أولاً', icon: Star },
  { value: 'name_asc', label: 'الاسم (أ-ي)', icon: SortAsc, direction: 'asc' },
  { value: 'name_desc', label: 'الاسم (ي-أ)', icon: SortDesc, direction: 'desc' },
  { value: 'price_asc', label: 'السعر (الأقل أولاً)', icon: DollarSign, direction: 'asc' },
  { value: 'price_desc', label: 'السعر (الأعلى أولاً)', icon: DollarSign, direction: 'desc' },
  { value: 'newest', label: 'الأحدث أولاً', icon: Calendar },
  { value: 'popular', label: 'الأكثر شعبية', icon: TrendingUp },
  { value: 'stock_desc', label: 'المتوفر أولاً', icon: Package }
];

export function ProductSortBar({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  resultsCount,
  totalCount,
  isLoading = false,
  onFilterToggle,
  showFilters = false,
  className = ''
}: ProductSortBarProps) {
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const currentSortOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // البحث يحدث تلقائياً عند تغيير النص
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* القسم الأيسر: البحث والنتائج */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          {/* شريط البحث */}
          <div className="relative flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit}>
              <div className={`relative transition-all duration-200 ${
                searchFocused ? 'ring-2 ring-blue-500' : ''
              }`}>
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* عداد النتائج */}
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {isLoading ? (
              <span>جاري البحث...</span>
            ) : (
              <span>
                عرض {resultsCount.toLocaleString('ar')} منتج
                {totalCount && totalCount !== resultsCount && (
                  <span> من أصل {totalCount.toLocaleString('ar')}</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* القسم الأيمن: التحكم والعرض (قابل للتمرير أفقيًا على الجوال) */}
        <div className="overflow-x-auto whitespace-nowrap -mx-2 px-2 w-full md:w-auto">
          <div className="flex items-center gap-3 flex-nowrap">
          {/* زر الفلاتر (للشاشات الصغيرة) */}
          {onFilterToggle && (
            <button
              onClick={onFilterToggle}
                className={`lg:hidden flex items-center min-w-[48px] px-3 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              فلاتر
            </button>
          )}

          {/* قائمة الترتيب */}
            <div className="relative min-w-[160px]">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[160px]"
            >
              {currentSortOption.icon && (
                <currentSortOption.icon className="w-4 h-4 mr-2 text-gray-500" />
              )}
              <span className="text-sm text-gray-700 flex-1 text-right">
                {currentSortOption.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 mr-2 transition-transform ${
                sortDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* قائمة خيارات الترتيب */}
            {sortDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-2">
                  {sortOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-2 text-sm text-right hover:bg-gray-50 transition-colors ${
                          sortBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {IconComponent && (
                          <IconComponent className="w-4 h-4 mr-3 text-gray-500" />
                        )}
                        <span className="flex-1">{option.label}</span>
                        {sortBy === option.value && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* أزرار وضع العرض */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden min-w-[100px]">
            <button
              onClick={() => onViewModeChange('grid')}
                className={`p-2 min-w-[48px] transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="عرض الشبكة"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
                className={`p-2 min-w-[48px] transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="عرض القائمة"
            >
              <List className="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* معلومات إضافية للبحث النشط */}
      {searchQuery && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-blue-700">
              <Search className="w-4 h-4 mr-2" />
              <span className="text-sm">
                نتائج البحث عن: <strong>"{searchQuery}"</strong>
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              مسح البحث
            </button>
          </div>
        </div>
      )}

      {/* خط فاصل للشاشات الكبيرة مع الفلاتر */}
      {showFilters && (
        <div className="hidden lg:block mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            <span>الفلاتر نشطة - استخدم الشريط الجانبي لتعديل معايير البحث</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductSortBar; 