'use client';

import { useState, useEffect } from 'react';
import { 
  Star, Trash2, Eye, Calendar, User, Package, Search, Filter, 
  ChevronDown, AlertCircle, Check, X, MessageSquare, CheckCircle, 
  Loader2, EyeOff, Settings, List, Trash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';

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
    slug: string;
    image: string;
  };
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  reviewsEnabled: boolean;
  ratingDistribution: { [key: number]: number };
}

export default function ReviewsManagementPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    reviewsEnabled: false,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');

  // Bulk delete
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/reviews-settings');
      const data = await response.json();
      
      if (data.success) {
        const reviewsList = data.reviews || [];
        setReviews(reviewsList);
        setFilteredReviews(reviewsList);
        
        // حساب توزيع التقييمات
        const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsList.forEach((review: Review) => {
          distribution[review.rating]++;
        });
        
        setStats({
          ...data.stats,
          ratingDistribution: distribution
        });
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      showMessage('error', 'حدث خطأ في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // الفلترة والبحث
  useEffect(() => {
    let filtered = [...reviews];

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.reviewer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRating !== null) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

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
    
    // مسح التحديدات عند تغيير الفلتر
    setSelectedReviews(new Set());
  }, [searchTerm, filterRating, sortBy, reviews]);

  const handleToggleReviews = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/reviews-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'toggle',
          enabled: !stats.reviewsEnabled 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', `تم ${!stats.reviewsEnabled ? 'تفعيل' : 'تعطيل'} نظام التقييمات بنجاح`);
        fetchData();
      } else {
        showMessage('error', data.error || 'حدث خطأ');
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    try {
      const response = await fetch('/api/dashboard/reviews-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'تم حذف التقييم بنجاح');
        fetchData();
      } else {
        showMessage('error', data.error || 'حدث خطأ في الحذف');
      }
    } catch (error) {
      showMessage('error', 'خطأ في حذف التقييم');
    }
  };

  // حذف متعدد
  const handleBulkDelete = async () => {
    if (selectedReviews.size === 0) {
      showMessage('error', 'يرجى اختيار تقييمات للحذف');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف ${selectedReviews.size} تقييم؟`)) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedReviews).map(reviewId =>
        fetch('/api/dashboard/reviews-settings', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewId })
        })
      );

      await Promise.all(deletePromises);
      showMessage('success', `تم حذف ${selectedReviews.size} تقييم بنجاح`);
      setSelectedReviews(new Set());
      fetchData();
    } catch (error) {
      showMessage('error', 'حدث خطأ في حذف التقييمات');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectReview = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
    }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* العنوان والـ Tabs */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة التقييمات</h1>
        <p className="text-gray-600 mb-6">إدارة وتتبع جميع تقييمات العملاء</p>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-reverse space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="h-5 w-5" />
              قائمة التقييمات
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {reviews.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-5 w-5" />
              الإعدادات
            </button>
          </nav>
        </div>
      </div>

      {/* رسالة النجاح/الخطأ */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* المحتوى حسب الـ Tab النشط */}
      {activeTab === 'list' ? (
        <div className="space-y-6">
          {/* الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي التقييمات</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
                </div>
                <MessageSquare className="h-10 w-10 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">متوسط التقييم</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-10 w-10 text-yellow-600 opacity-20 fill-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">تقييمات 5 نجوم</p>
                  <p className="text-3xl font-bold text-green-600">{stats.ratingDistribution[5] || 0}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-green-600 text-green-600" />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">حالة النظام</p>
                  <p className={`text-xl font-bold ${stats.reviewsEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {stats.reviewsEnabled ? 'مفعّل' : 'معطّل'}
                  </p>
                </div>
                {stats.reviewsEnabled ? (
                  <Eye className="h-10 w-10 text-green-600 opacity-20" />
                ) : (
                  <EyeOff className="h-10 w-10 text-gray-400 opacity-20" />
                )}
              </div>
            </div>
          </div>

          {/* أدوات البحث والفلترة */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="grid grid-cols-1 gap-4">
              {/* الصف الأول: البحث والفلاتر */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* البحث */}
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="بحث في التقييمات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* فلتر التقييم */}
                <select
                  value={filterRating === null ? '' : filterRating}
                  onChange={(e) => setFilterRating(e.target.value === '' ? null : Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">جميع التقييمات</option>
                  <option value="5">5 نجوم</option>
                  <option value="4">4 نجوم</option>
                  <option value="3">3 نجوم</option>
                  <option value="2">نجمتان</option>
                  <option value="1">نجمة واحدة</option>
                </select>

                {/* الترتيب */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">الأحدث أولاً</option>
                  <option value="oldest">الأقدم أولاً</option>
                  <option value="rating">الأعلى تقييماً</option>
                </select>
              </div>

              {/* الصف الثاني: أدوات الحذف الجماعي */}
              {filteredReviews.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedReviews.size === filteredReviews.length && filteredReviews.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      {selectedReviews.size > 0 ? (
                        <span className="font-medium text-blue-600">
                          تم تحديد {selectedReviews.size} تقييم
                        </span>
                      ) : (
                        'تحديد الكل'
                      )}
                    </span>
                  </div>

                  {selectedReviews.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                      حذف المحددة ({selectedReviews.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* قائمة التقييمات */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                التقييمات ({filteredReviews.length})
              </h2>
              
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    {reviews.length === 0 ? 'لا توجد تقييمات بعد' : 'لا توجد نتائج للبحث'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {reviews.length === 0 ? 'عندما يضيف العملاء تقييمات، ستظهر هنا' : 'جرب تغيير معايير البحث'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        {/* Checkbox للحذف الجماعي */}
                        <input
                          type="checkbox"
                          checked={selectedReviews.has(review.id)}
                          onChange={() => toggleSelectReview(review.id)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                        />

                        {/* صورة المنتج */}
                        {review.product && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            {review.product.image ? (
                              <Image
                                src={review.product.image}
                                alt={review.product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // في حالة فشل تحميل الصورة، إخفاء العنصر
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* المحتوى */}
                        <div className="flex-1 min-w-0">
                          {/* المستخدم والتقييم */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-gray-900">{review.reviewer_name}</h3>
                                <StarRating rating={review.rating} />
                              </div>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ar })}
                              </p>
                            </div>
                          </div>

                          {/* المنتج */}
                          {review.product && (
                            <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg p-2">
                              <Package className="h-4 w-4 text-gray-600 flex-shrink-0" />
                              <Link 
                                href={`/product/${review.product.slug}`}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium truncate"
                                target="_blank"
                              >
                                {review.product.name}
                              </Link>
                            </div>
                          )}

                          {/* التعليق */}
                          <p className="text-gray-700 leading-relaxed break-words">{review.comment}</p>
                        </div>

                        {/* زر الحذف */}
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex-shrink-0"
                          title="حذف التقييم"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* تبويب الإعدادات */
        <div className="space-y-6">
          {/* بطاقة التحكم */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">تفعيل/تعطيل نظام التقييمات</h2>
                <p className="text-sm text-gray-600">تحكم في ظهور قسم التقييمات في صفحات المنتجات</p>
              </div>
              <button
                onClick={handleToggleReviews}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  stats.reviewsEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : stats.reviewsEnabled ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
                {stats.reviewsEnabled ? 'مفعّل' : 'معطّل'}
              </button>
            </div>

            <div className={`p-4 rounded-lg ${stats.reviewsEnabled ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-start gap-3">
                {stats.reviewsEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${stats.reviewsEnabled ? 'text-green-900' : 'text-yellow-900'}`}>
                    {stats.reviewsEnabled ? 'نظام التقييمات مفعّل' : 'نظام التقييمات معطّل'}
                  </p>
                  <p className={`text-sm mt-1 ${stats.reviewsEnabled ? 'text-green-700' : 'text-yellow-700'}`}>
                    {stats.reviewsEnabled 
                      ? 'العملاء يمكنهم رؤية وإضافة تقييمات على المنتجات'
                      : 'قسم التقييمات مخفي عن العملاء. قم بالتفعيل لإظهاره'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* توزيع التقييمات */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">توزيع التقييمات</h2>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-sm font-medium text-gray-700 w-4">{rating}</span>
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-left font-medium">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
