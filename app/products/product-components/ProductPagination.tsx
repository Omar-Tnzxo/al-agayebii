'use client';

import { useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  isLoading?: boolean;
  className?: string;
  showItemsPerPage?: boolean;
  showPageInfo?: boolean;
}

const itemsPerPageOptions = [12, 24, 48, 96];

export function ProductPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
  className = '',
  showItemsPerPage = true,
  showPageInfo = true
}: ProductPaginationProps) {
  // حساب رقم أول وآخر عنصر في الصفحة الحالية
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // حساب أرقام الصفحات المرئية
  const visiblePages = useMemo(() => {
    const delta = 2; // عدد الصفحات المرئية حول الصفحة الحالية
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  // عدم عرض التنقل إذا كانت هناك صفحة واحدة فقط
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isLoading) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      <div className="px-4 py-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* معلومات الصفحة */}
          {showPageInfo && (
            <div className="text-sm text-gray-700">
              <p>
                عرض <span className="font-medium">{startItem.toLocaleString('en-US')}</span> إلى{' '}
                <span className="font-medium">{endItem.toLocaleString('en-US')}</span> من{' '}
                <span className="font-medium">{totalItems.toLocaleString('en-US')}</span> منتج
              </p>
            </div>
          )}

          {/* عدد العناصر في الصفحة */}
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center text-sm text-gray-700">
              <label htmlFor="items-per-page" className="mr-2">
                عدد المنتجات:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                disabled={isLoading}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* أزرار التنقل */}
        <div className="mt-4 flex items-center justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" dir="ltr">
            {/* الصفحة الأولى */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="الصفحة الأولى"
            >
              <ChevronsLeft className="h-5 w-5" />
            </button>

            {/* الصفحة السابقة */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="الصفحة السابقة"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* أرقام الصفحات */}
            {visiblePages.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`dots-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </span>
                );
              }

              const pageNumber = page as number;
              const isCurrentPage = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isLoading}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber.toLocaleString('en-US')}
                </button>
              );
            })}

            {/* الصفحة التالية */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="الصفحة التالية"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* الصفحة الأخيرة */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="الصفحة الأخيرة"
            >
              <ChevronsRight className="h-5 w-5" />
            </button>
          </nav>
        </div>

        {/* مؤشر التحميل */}
        {isLoading && (
          <div className="mt-4 flex justify-center">
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              جاري تحميل المنتجات...
            </div>
          </div>
        )}

        {/* معلومات إضافية */}
        <div className="mt-4 text-center text-xs text-gray-500">
          صفحة {currentPage.toLocaleString('en-US')} من {totalPages.toLocaleString('en-US')}
        </div>
      </div>
    </div>
  );
}

export default ProductPagination; 