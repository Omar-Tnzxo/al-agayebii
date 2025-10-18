'use client';

import { useState, useEffect } from 'react';
import { Star, Trash2, Eye, Calendar, User, Package, Search, Filter, ChevronDown, AlertCircle, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image: string;
  };
}

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');

  // رسائل النجاح/الخطأ
  const [message, setMessage] = useState({ type: '', text: '' });

  // جلب التقييمات
  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reviews/all');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setReviews(data.data);
          setFilteredReviews(data.data);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب التقييمات:', error);
      showMessage('error', 'حدث خطأ في جلب التقييمات');
    } finally {
      setIsLoading(false);
    }
  };

  // الفلترة والبحث
  useEffect(() => {
    let filtered = [...reviews];

    // البحث
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.reviewer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلترة التقييم
    if (filterRating !== null) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    // الترتيب
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredReviews(filtered);
  }, [searchTerm, filterRating, sortBy, reviews]);

  // حذف تقييم
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', 'تم حذف التقييم بنجاح');
        fetchAllReviews();
      } else {
        showMessage('error', 'فشل حذف التقييم');
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ أثناء حذف التقييم');
    }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // مكون النجوم
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // إحصائيات
  const stats = {
    total: reviews.length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0',
    fiveStars: reviews.filter(r => r.rating === 5).length,
    fourStars: reviews.filter(r => r.rating === 4).length,
    threeStars: reviews.filter(r => r.rating === 3).length,
    twoStars: reviews.filter(r => r.rating === 2).length,
    oneStar: reviews.filter(r => r.rating === 1).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* رسالة النجاح/الخطأ */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* العنوان */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            إدارة التقييمات
          </h1>
          <p className="text-gray-600 mt-2">عرض وإدارة جميع تقييمات العملاء على المنتجات</p>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي التقييمات</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">متوسط التقييم</p>
                <p className="text-3xl font-bold text-yellow-500">{stats.averageRating}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">5 نجوم</p>
                <p className="text-3xl font-bold text-green-600">{stats.fiveStars}</p>
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="h-4 w-4 text-green-600 fill-green-600" />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">1 نجمة</p>
                <p className="text-3xl font-bold text-red-600">{stats.oneStar}</p>
              </div>
              <div className="flex">
                <Star className="h-4 w-4 text-red-600 fill-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* الفلاتر والبحث */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في التقييمات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* فلتر التقييم */}
            <div>
              <select
                value={filterRating || ''}
                onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع التقييمات</option>
                <option value="5">5 نجوم</option>
                <option value="4">4 نجوم</option>
                <option value="3">3 نجوم</option>
                <option value="2">نجمتان</option>
                <option value="1">نجمة واحدة</option>
              </select>
            </div>

            {/* الترتيب */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'rating')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="rating">الأعلى تقييماً</option>
              </select>
            </div>
          </div>
        </div>

        {/* قائمة التقييمات */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تقييمات</h3>
            <p className="text-gray-600">لم يتم العثور على تقييمات بالمعايير المحددة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  {/* معلومات المنتج */}
                  <div className="flex items-start gap-4 flex-1">
                    {review.product && (
                      <div className="flex-shrink-0">
                        <img
                          src={review.product.image || '/images/drill.png'}
                          alt={review.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* المنتج */}
                      {review.product && (
                        <Link
                          href={`/product/${review.product.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2 flex items-center gap-1"
                        >
                          <Package className="h-4 w-4" />
                          {review.product.name}
                        </Link>
                      )}

                      {/* المراجع والتقييم */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>

                      {/* التعليق */}
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.comment}</p>

                      {/* التاريخ */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ar })}
                      </div>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف التقييم"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
