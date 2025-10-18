'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, AlertCircle, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';

interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  product?: {
    name: string;
    slug: string;
  };
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  reviewsEnabled: boolean;
}

export default function ReviewsSettingsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    reviewsEnabled: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reviewsEnabled, setReviewsEnabled] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // جلب الإحصائيات والتقييمات
      const response = await fetch('/api/dashboard/reviews-settings');
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || { totalReviews: 0, averageRating: 0, reviewsEnabled: false });
        setReviewsEnabled(data.stats?.reviewsEnabled || false);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      showMessage('error', 'حدث خطأ في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReviews = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/reviews-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'toggle',
          enabled: !reviewsEnabled 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setReviewsEnabled(!reviewsEnabled);
        showMessage('success', `تم ${!reviewsEnabled ? 'تفعيل' : 'تعطيل'} نظام التقييمات بنجاح`);
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
      showMessage('error', 'حدث خطأ في حذف التقييم');
    }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* العنوان */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة التقييمات</h1>
        <p className="text-gray-600">تحكم في نظام التقييمات وعرض جميع التقييمات</p>
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

      {/* بطاقة التحكم الرئيسية */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">تفعيل/تعطيل نظام التقييمات</h2>
            <p className="text-sm text-gray-600">تحكم في ظهور قسم التقييمات في صفحات المنتجات</p>
          </div>
          <button
            onClick={handleToggleReviews}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              reviewsEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : reviewsEnabled ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
            {reviewsEnabled ? 'مفعّل' : 'معطّل'}
          </button>
        </div>

        <div className={`p-4 rounded-lg ${reviewsEnabled ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            {reviewsEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${reviewsEnabled ? 'text-green-900' : 'text-yellow-900'}`}>
                {reviewsEnabled ? 'نظام التقييمات مفعّل' : 'نظام التقييمات معطّل'}
              </p>
              <p className={`text-sm mt-1 ${reviewsEnabled ? 'text-green-700' : 'text-yellow-700'}`}>
                {reviewsEnabled 
                  ? 'العملاء يمكنهم رؤية وإضافة تقييمات على المنتجات'
                  : 'قسم التقييمات مخفي عن العملاء. قم بالتفعيل لإظهاره'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">إجمالي التقييمات</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">متوسط التقييم</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">حالة النظام</p>
              <p className={`text-xl font-bold ${reviewsEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {reviewsEnabled ? 'مفعّل ✓' : 'معطّل ✗'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${reviewsEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              {reviewsEnabled ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* قائمة التقييمات */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">جميع التقييمات ({reviews.length})</h2>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">لا توجد تقييمات بعد</p>
            <p className="text-sm text-gray-500 mt-1">عندما يضيف العملاء تقييمات، ستظهر هنا</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{review.reviewer_name}</h3>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.product && (
                      <p className="text-sm text-gray-600 mb-2">
                        على المنتج: <span className="font-medium text-blue-600">{review.product.name}</span>
                      </p>
                    )}
                    <p className="text-gray-700">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
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
  );
}
