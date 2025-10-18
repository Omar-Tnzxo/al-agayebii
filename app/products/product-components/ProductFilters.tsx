'use client';

import { useState, useEffect } from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  DollarSign, 
  Package, 
  Star,
  Crown,
  Zap,
  Flame,
  CheckCircle,
  Palette,
  Tag,
  Search,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: string;
  count?: number;
}

interface FilterState {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  inStock: boolean;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isExclusive: boolean;
  rating: number;
  colors: string[];
  ratingMode: 'exact' | 'atLeast';
}

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isLoading?: boolean;
  className?: string;
  productCounts?: {
    total: number;
    inStock: number;
    onSale: number;
    isNew: number;
    isFeatured: number;
    isPopular: number;
    isExclusive: number;
  };
}

export function ProductFilters({
  categories,
  filters,
  onFiltersChange,
  isLoading = false,
  className = '',
  productCounts
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    features: true,
    colors: false
  });

  const [priceInputs, setPriceInputs] = useState({
    min: filters.priceRange.min.toString(),
    max: filters.priceRange.max.toString()
  });

  // تحديث مدخلات الأسعار عند تغيير الفلاتر
  useEffect(() => {
    setPriceInputs({
      min: filters.priceRange.min.toString(),
      max: filters.priceRange.max.toString()
    });
  }, [filters.priceRange]);

  // تبديل حالة توسيع القسم
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // تحديث فلتر الفئات
  const updateCategoryFilter = (categoryType: string, checked: boolean) => {
    const newCategories = checked 
      ? [...filters.categories, categoryType]
      : filters.categories.filter(cat => cat !== categoryType);
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  // تحديث نطاق الأسعار
  const updatePriceRange = () => {
    const min = Math.max(0, parseInt(priceInputs.min) || 0);
    const max = Math.max(min, parseInt(priceInputs.max) || 10000);
    
    onFiltersChange({
      ...filters,
      priceRange: { min, max }
    });
  };


  // تحديث فلاتر المزايا
  const updateFeatureFilter = (feature: keyof FilterState, value: boolean) => {
    onFiltersChange({
      ...filters,
      [feature]: value
    });
  };

  // إعادة تعيين جميع الفلاتر
  const resetFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: { min: 0, max: 10000 },
      inStock: false,
      onSale: false,
      isNew: false,
      isFeatured: false,
      isPopular: false,
      isExclusive: false,
      rating: 0,
      colors: [],
      ratingMode: 'exact'
    });
    setPriceInputs({ min: '0', max: '10000' });
  };


  // حساب عدد الفلاتر النشطة
  const activeFiltersCount =
    filters.categories.length +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.isNew ? 1 : 0) +
    (filters.isFeatured ? 1 : 0) +
    (filters.isPopular ? 1 : 0) +
    (filters.priceRange.min > 0 || filters.priceRange.max < 10000 ? 1 : 0);

  // عرّف مصفوفة الفلاتر كمصفوفة ثابتة:
  const features: Array<{
    key: keyof FilterState;
    label: string;
    icon: any;
    count?: number;
  }> = [
    { key: 'onSale', label: 'عروض وخصومات', icon: Tag, count: productCounts?.onSale },
    { key: 'isNew', label: 'منتجات جديدة', icon: Zap, count: productCounts?.isNew },
    { key: 'isFeatured', label: 'منتجات مميزة', icon: Crown, count: productCounts?.isFeatured },
    { key: 'isPopular', label: 'منتجات رائجة', icon: Flame, count: productCounts?.isPopular },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {/* رأس الفلاتر */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">الفلاتر</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-gray-500 hover:text-red-500 transition-colors flex items-center text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              إعادة تعيين
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* فلتر الفئات */}
        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              الفئات
            </h4>
            {expandedSections.categories ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.categories && (
            <div className="mt-3 space-y-2">
              {categories.map((category) => (
                <label key={category.type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.type)}
                    onChange={(e) => updateCategoryFilter(category.type, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="mr-2 text-sm text-gray-700 flex-1">
                    {category.name}
                  </span>
                  {category.count !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {category.count}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* فلتر الأسعار */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              نطاق السعر
            </h4>
            {expandedSections.price ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.price && (
            <div className="mt-3 space-y-3">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">من</label>
                  <input
                    type="number"
                    min="0"
                    value={priceInputs.min}
                    onChange={(e) => setPriceInputs(prev => ({ ...prev, min: e.target.value }))}
                    onBlur={updatePriceRange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">إلى</label>
                  <input
                    type="number"
                    min="0"
                    value={priceInputs.max}
                    onChange={(e) => setPriceInputs(prev => ({ ...prev, max: e.target.value }))}
                    onBlur={updatePriceRange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>
              </div>
              
              {/* أزرار الأسعار السريعة */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'أقل من 100', min: 0, max: 100 },
                  { label: '100-500', min: 100, max: 500 },
                  { label: '500-1000', min: 500, max: 1000 },
                  { label: 'أكثر من 1000', min: 1000, max: 10000 }
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      setPriceInputs({ min: range.min.toString(), max: range.max.toString() });
                      onFiltersChange({
                        ...filters,
                        priceRange: { min: range.min, max: range.max }
                      });
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* فلتر المزايا */}
        <div>
          <button
            onClick={() => toggleSection('features')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <Sliders className="w-4 h-4 mr-2" />
              مزايا المنتج
            </h4>
            {expandedSections.features ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.features && (
            <div className="mt-3 space-y-2">
              {features.map((feature) => (
                <button
                  key={feature.key}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${!!filters[feature.key as keyof FilterState] ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300'}`}
                  onClick={() => onFiltersChange({ ...filters, [feature.key]: !filters[feature.key as keyof FilterState] })}
                  aria-pressed={!!filters[feature.key as keyof FilterState] === true}
                  aria-label={`فلتر ${feature.label}`}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onFiltersChange({ ...filters, [feature.key]: !filters[feature.key as keyof FilterState] }); }}
                >
                  <feature.icon className="w-4 h-4" /> {feature.label}
                  {feature.count !== undefined && <span className="ml-1 text-xs text-gray-500">({feature.count})</span>}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProductFilters; 