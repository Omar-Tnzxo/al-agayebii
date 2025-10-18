'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, TrendingUp, Clock } from 'lucide-react';

interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  hasDiscount: boolean;
}

interface SearchBarProps {
  variant?: 'header' | 'hero';
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ 
  variant = 'header', 
  placeholder = 'ابحث عن منتجات، فئات، علامات تجارية...', 
  autoFocus = false 
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // تحميل عمليات البحث الأخيرة من localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جلب الاقتراحات
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // معالج تغيير النص مع debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // حفظ البحث في السجل
  const saveToRecentSearches = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // معالج إرسال البحث
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveToRecentSearches(query.trim());
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // مسح حقل البحث
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // حذف بحث من السجل
  const removeRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // استخدام بحث من السجل
  const useRecentSearch = (search: string) => {
    setQuery(search);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(search)}`);
  };

  const isHeroVariant = variant === 'hero';
  const inputClasses = isHeroVariant
    ? 'w-full py-4 px-6 pr-14 rounded-full border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-lg transition-all'
    : 'w-full py-2.5 px-4 pr-11 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        {/* أيقونة البحث */}
        <div className={`absolute ${isHeroVariant ? 'right-5 top-1/2' : 'right-3 top-1/2'} transform -translate-y-1/2 pointer-events-none`}>
          <Search className={`${isHeroVariant ? 'h-6 w-6' : 'h-5 w-5'} text-gray-400`} />
        </div>

        {/* حقل الإدخال */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={inputClasses}
          aria-label="البحث"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
        />

        {/* زر المسح */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute ${isHeroVariant ? 'left-5 top-1/2' : 'left-3 top-1/2'} transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors`}
            aria-label="مسح البحث"
          >
            <X className={`${isHeroVariant ? 'h-5 w-5' : 'h-4 w-4'} text-gray-400`} />
          </button>
        )}
      </form>

      {/* القائمة المنسدلة للاقتراحات */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-[500px] overflow-y-auto z-50"
          role="listbox"
        >
          {/* حالة التحميل */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="inline-block w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* عمليات البحث الأخيرة */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                عمليات البحث الأخيرة
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => useRecentSearch(search)}
                  className="w-full px-3 py-2 text-right hover:bg-gray-50 rounded-md flex items-center justify-between group transition-colors"
                >
                  <span className="text-gray-700">{search}</span>
                  <button
                    onClick={(e) => removeRecentSearch(search, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                    aria-label="حذف من السجل"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* اقتراحات المنتجات */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                منتجات مقترحة
              </div>
              {suggestions.map((suggestion) => (
                <Link
                  key={suggestion.id}
                  href={`/product/${suggestion.slug}`}
                  onClick={() => {
                    setShowSuggestions(false);
                    saveToRecentSearches(suggestion.name);
                  }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors group"
                  role="option"
                >
                  {/* صورة المنتج */}
                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {suggestion.image ? (
                      <Image
                        src={suggestion.image}
                        alt={suggestion.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Search className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* معلومات المنتج */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                      {suggestion.name}
                    </p>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      {suggestion.price.toLocaleString('ar-EG')} جنيه
                      {suggestion.hasDiscount && (
                        <span className="mr-2 text-xs text-red-600 font-normal">خصم</span>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* رسالة "عرض جميع النتائج" */}
          {query && suggestions.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={handleSubmit}
                className="w-full px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors text-center"
              >
                عرض جميع النتائج لـ "{query}"
              </button>
            </div>
          )}

          {/* رسالة عدم وجود نتائج */}
          {!isLoading && query && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">لا توجد نتائج</p>
              <p className="text-sm text-gray-400">جرب كلمات بحث مختلفة</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
