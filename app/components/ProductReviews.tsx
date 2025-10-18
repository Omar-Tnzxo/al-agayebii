'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, User, Calendar, CheckCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLiveSiteSettings } from '@/app/components/useLiveSiteSettings';

interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { settings } = useLiveSiteSettings();
  const reviewsEnabled = settings.reviews_enabled === 'true';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);

  // حالة النموذج
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  // جلب التقييمات
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setReviews(data.data);
          calculateStats(data.data);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب التقييمات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // حساب الإحصائيات
  const calculateStats = (reviewsData: Review[]) => {
    if (reviewsData.length === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
      return;
    }

    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviewsData.length;

    const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      distribution[review.rating]++;
    });

    setStats({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviewsData.length,
      ratingDistribution: distribution
    });
  };

  // التعامل مع إرسال التقييم
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewForm.reviewer_name.trim() || !reviewForm.comment.trim()) {
      setSubmitMessage({ type: 'error', text: 'يرجى إكمال جميع الحقول المطلوبة' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitMessage({ type: 'success', text: 'شكراً لك! تم إضافة تقييمك بنجاح' });
        setReviewForm({ reviewer_name: '', rating: 5, comment: '' });
        setShowAddReview(false);
        // إعادة جلب التقييمات
        setTimeout(() => {
          fetchReviews();
          setSubmitMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setSubmitMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء إضافة التقييم' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'حدث خطأ أثناء إضافة التقييم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // مكون النجوم
  const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (rating: number) => void; interactive?: boolean }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  // إذا كانت التقييمات معطلة، لا تعرض أي شيء
  if (!reviewsEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-100 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رسالة النجاح/الخطأ */}
      {submitMessage.text && (
        <div className={`p-4 rounded-lg ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {submitMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            <span className="font-medium">{submitMessage.text}</span>
          </div>
        </div>
      )}

      {/* العنوان والإحصائيات */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
            <div>
              <StarRating rating={Math.round(stats.averageRating)} />
              <p className="text-xs text-gray-600 mt-1">{stats.totalReviews} تقييم</p>
            </div>
          </div>
        </div>

        {/* زر إضافة تقييم */}
        <button
          onClick={() => setShowAddReview(!showAddReview)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <MessageSquare className="h-4 w-4" />
          {showAddReview ? 'إخفاء النموذج' : 'أضف تقييمك'}
        </button>
      </div>

      {/* توزيع التقييمات */}
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating] || 0;
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-24">
                <span className="text-sm font-medium text-gray-700">{rating}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-left">{count}</span>
            </div>
          );
        })}
      </div>

      {/* نموذج إضافة تقييم */}
      {showAddReview && (
        <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          <h3 className="text-base font-bold text-gray-900">أضف تقييمك</h3>

          {/* الاسم */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم *
            </label>
            <input
              type="text"
              value={reviewForm.reviewer_name}
              onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
              placeholder="اسمك الكامل"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          {/* التقييم */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              التقييم *
            </label>
            <StarRating
              rating={reviewForm.rating}
              onRate={(rating) => setReviewForm({ ...reviewForm, rating })}
              interactive={true}
            />
          </div>

          {/* التعليق */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تعليقك *
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="شارك تجربتك مع هذا المنتج..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              required
            />
          </div>

          {/* زر الإرسال */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddReview(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* قائمة التقييمات */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">لا توجد تقييمات بعد</h3>
            <p className="text-xs text-gray-600">كن أول من يقيم هذا المنتج!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              {/* رأس التقييم */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">{review.reviewer_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ar })}
                </div>
              </div>

              {/* التعليق */}
              <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
