import { logger } from '@/lib/utils/logger';
import { sanitizeInput } from '@/lib/security/encryption';
import { cacheManager, setCache, getCache } from '@/lib/cache/cache-manager';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  images?: string[];
  verified: boolean; // مراجعة موثقة (من مشتري فعلي)
  helpful: number; // عدد من وجدوها مفيدة
  reported: number; // عدد البلاغات
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  createdAt: number;
  updatedAt: number;
  adminReply?: {
    message: string;
    adminName: string;
    timestamp: number;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>; // 1-5 stars
  verifiedReviewsCount: number;
  recentReviews: Review[];
}

export interface ReviewFilters {
  rating?: number[];
  verified?: boolean;
  withImages?: boolean;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
  limit?: number;
  offset?: number;
}

class ReviewSystem {
  private static instance: ReviewSystem;
  private reviews: Map<string, Review> = new Map();
  private productStats: Map<string, ReviewStats> = new Map();
  private helpfulVotes: Map<string, Set<string>> = new Map(); // reviewId -> userIds

  private constructor() {
    // تنظيف البيانات المؤقتة كل ساعة
    setInterval(() => this.cleanupTempData(), 60 * 60 * 1000);
  }

  public static getInstance(): ReviewSystem {
    if (!ReviewSystem.instance) {
      ReviewSystem.instance = new ReviewSystem();
    }
    return ReviewSystem.instance;
  }

  /**
   * إضافة مراجعة جديدة
   */
  async addReview(reviewData: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }): Promise<string> {
    // التحقق من صحة البيانات
    if (!this.validateReviewData(reviewData)) {
      throw new Error('بيانات المراجعة غير صحيحة');
    }

    // التحقق من عدم وجود مراجعة سابقة من نفس المستخدم للمنتج
    const existingReview = this.getUserReviewForProduct(reviewData.userId, reviewData.productId);
    if (existingReview) {
      throw new Error('لقد قمت بمراجعة هذا المنتج من قبل');
    }

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const review: Review = {
      id: reviewId,
      productId: reviewData.productId,
      userId: reviewData.userId,
      userName: sanitizeInput(reviewData.userName),
      rating: Math.max(1, Math.min(5, Math.round(reviewData.rating))),
      title: sanitizeInput(reviewData.title),
      comment: sanitizeInput(reviewData.comment),
      images: reviewData.images?.map(img => sanitizeInput(img)),
      verified: Math.random() < 0.7, // محاكاة
      helpful: 0,
      reported: 0,
      status: 'pending', // تحتاج موافقة المدير
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.reviews.set(reviewId, review);
    
    // إعادة حساب إحصائيات المنتج
    await this.updateProductStats(reviewData.productId);
    
    logger.info(`⭐ New review added for product ${reviewData.productId}`, {
      reviewId,
      rating: review.rating,
      verified: review.verified
    });

    return reviewId;
  }

  /**
   * الحصول على مراجعات منتج
   */
  async getProductReviews(productId: string, filters?: ReviewFilters): Promise<{
    reviews: Review[];
    stats: ReviewStats;
    pagination: {
      total: number;
      offset: number;
      limit: number;
      hasMore: boolean;
    };
  }> {
    const cacheKey = `product_reviews_${productId}_${JSON.stringify(filters)}`;
    const cached = getCache<{
      reviews: Review[];
      stats: ReviewStats;
      pagination: {
        total: number;
        offset: number;
        limit: number;
        hasMore: boolean;
      };
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { limit = 10, offset = 0, sortBy = 'newest' } = filters || {};
    
    // فلترة المراجعات
    let productReviews = Array.from(this.reviews.values())
      .filter(review => 
        review.productId === productId && 
        review.status === 'approved'
      );

    // تطبيق الفلاتر
    if (filters?.rating?.length) {
      productReviews = productReviews.filter(review => 
        filters.rating!.includes(review.rating)
      );
    }

    if (filters?.verified !== undefined) {
      productReviews = productReviews.filter(review => 
        review.verified === filters.verified
      );
    }

    if (filters?.withImages) {
      productReviews = productReviews.filter(review => 
        review.images && review.images.length > 0
      );
    }

    // ترتيب المراجعات
    productReviews = this.sortReviews(productReviews, sortBy);

    // التصفح
    const total = productReviews.length;
    const paginatedReviews = productReviews.slice(offset, offset + limit);

    // إحصائيات المنتج
    const stats = await this.getProductStats(productId);

    const result = {
      reviews: paginatedReviews,
      stats,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    };

    // حفظ في Cache لمدة 15 دقيقة
    setCache(cacheKey, result, 15);

    return result;
  }

  /**
   * الحصول على إحصائيات المنتج
   */
  async getProductStats(productId: string): Promise<ReviewStats> {
    const cacheKey = `product_stats_${productId}`;
    const cached = getCache<ReviewStats>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const productReviews = Array.from(this.reviews.values())
      .filter(review => 
        review.productId === productId && 
        review.status === 'approved'
      );

    const totalReviews = productReviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedReviewsCount: 0,
        recentReviews: []
      };
    }

    // حساب المتوسط
    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // توزيع التقييمات
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    productReviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    const verifiedReviewsCount = productReviews.filter(review => review.verified).length;
    
    // أحدث المراجعات
    const recentReviews = productReviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const stats: ReviewStats = {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      verifiedReviewsCount,
      recentReviews
    };

    // حفظ في Cache لمدة 30 دقيقة
    setCache(cacheKey, stats, 30);

    return stats;
  }

  /**
   * تسجيل أن المراجعة مفيدة
   */
  markAsHelpful(reviewId: string, userId: string): boolean {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return false;
    }

    if (!this.helpfulVotes.has(reviewId)) {
      this.helpfulVotes.set(reviewId, new Set());
    }

    const voters = this.helpfulVotes.get(reviewId)!;
    
    if (voters.has(userId)) {
      // إلغاء التصويت
      voters.delete(userId);
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      // إضافة التصويت
      voters.add(userId);
      review.helpful++;
    }

    this.reviews.set(reviewId, review);
    
    // مسح Cache المنتج المرتبط
    this.clearProductCache(review.productId);
    
    logger.debug(`👍 Review ${reviewId} helpful count: ${review.helpful}`);
    return true;
  }

  /**
   * الإبلاغ عن مراجعة
   */
  reportReview(reviewId: string, userId: string, reason: string): boolean {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return false;
    }

    review.reported++;
    
    // إخفاء تلقائياً إذا تم الإبلاغ عنها أكثر من 5 مرات
    if (review.reported >= 5) {
      review.status = 'hidden';
    }

    this.reviews.set(reviewId, review);
    
    logger.warn(`🚨 Review ${reviewId} reported (${review.reported} reports)`, {
      reason: sanitizeInput(reason),
      reportedBy: userId
    });

    return true;
  }

  /**
   * رد المدير على المراجعة
   */
  addAdminReply(reviewId: string, adminName: string, message: string): boolean {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return false;
    }

    review.adminReply = {
      message: sanitizeInput(message),
      adminName: sanitizeInput(adminName),
      timestamp: Date.now()
    };

    review.updatedAt = Date.now();
    this.reviews.set(reviewId, review);
    
    // مسح Cache المنتج
    this.clearProductCache(review.productId);
    
    logger.info(`💬 Admin reply added to review ${reviewId}`);
    return true;
  }

  /**
   * تحديث حالة المراجعة (موافقة/رفض)
   */
  updateReviewStatus(reviewId: string, status: Review['status'], adminNote?: string): boolean {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return false;
    }

    const oldStatus = review.status;
    review.status = status;
    review.updatedAt = Date.now();
    
    this.reviews.set(reviewId, review);
    
    // إعادة حساب إحصائيات المنتج
    this.updateProductStats(review.productId);
    
    logger.info(`📝 Review ${reviewId} status changed: ${oldStatus} → ${status}`, {
      adminNote: adminNote ? sanitizeInput(adminNote) : undefined
    });

    return true;
  }

  /**
   * البحث في المراجعات
   */
  searchReviews(query: string, filters?: {
    productId?: string;
    minRating?: number;
    maxRating?: number;
    verified?: boolean;
  }): Review[] {
    const searchTerm = sanitizeInput(query.toLowerCase());
    
    return Array.from(this.reviews.values())
      .filter(review => {
        // البحث في النص
        const matchesSearch = 
          review.title.toLowerCase().includes(searchTerm) ||
          review.comment.toLowerCase().includes(searchTerm) ||
          review.userName.toLowerCase().includes(searchTerm);

        if (!matchesSearch) return false;

        // تطبيق الفلاتر
        if (filters?.productId && review.productId !== filters.productId) return false;
        if (filters?.minRating && review.rating < filters.minRating) return false;
        if (filters?.maxRating && review.rating > filters.maxRating) return false;
        if (filters?.verified !== undefined && review.verified !== filters.verified) return false;

        return review.status === 'approved';
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * إحصائيات عامة للمراجعات
   */
  getOverallStats(): {
    totalReviews: number;
    averageRating: number;
    pendingReviews: number;
    reportedReviews: number;
    verifiedPercentage: number;
  } {
    const allReviews = Array.from(this.reviews.values());
    const approvedReviews = allReviews.filter(r => r.status === 'approved');
    
    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;
    
    const pendingReviews = allReviews.filter(r => r.status === 'pending').length;
    const reportedReviews = allReviews.filter(r => r.reported > 0).length;
    const verifiedCount = approvedReviews.filter(r => r.verified).length;
    const verifiedPercentage = approvedReviews.length > 0 ? (verifiedCount / approvedReviews.length) * 100 : 0;

    return {
      totalReviews: approvedReviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      pendingReviews,
      reportedReviews,
      verifiedPercentage: Math.round(verifiedPercentage)
    };
  }

  /**
   * التحقق من صحة بيانات المراجعة
   */
  private validateReviewData(data: any): boolean {
    if (!data.productId || !data.userId || !data.userName) return false;
    if (!data.title || data.title.trim().length < 5) return false;
    if (!data.comment || data.comment.trim().length < 10) return false;
    if (data.rating < 1 || data.rating > 5) return false;
    return true;
  }

  /**
   * البحث عن مراجعة المستخدم للمنتج
   */
  private getUserReviewForProduct(userId: string, productId: string): Review | undefined {
    return Array.from(this.reviews.values())
      .find(review => 
        review.userId === userId && 
        review.productId === productId &&
        review.status !== 'rejected'
      );
  }

  /**
   * ترتيب المراجعات
   */
  private sortReviews(reviews: Review[], sortBy: string): Review[] {
    return reviews.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }

  /**
   * تحديث إحصائيات المنتج
   */
  private async updateProductStats(productId: string): Promise<void> {
    // مسح Cache المنتج
    this.clearProductCache(productId);
    
    // إعادة حساب الإحصائيات
    await this.getProductStats(productId);
  }

  /**
   * مسح Cache المنتج
   */
  private clearProductCache(productId: string): void {
    cacheManager.deletePattern(`product_.*_${productId}`);
  }

  /**
   * تنظيف البيانات المؤقتة
   */
  private cleanupTempData(): void {
    // تنظيف تصويتات "مفيدة" للمراجعات المحذوفة
    for (const reviewId of this.helpfulVotes.keys()) {
      if (!this.reviews.has(reviewId)) {
        this.helpfulVotes.delete(reviewId);
      }
    }

    logger.debug('🧹 Cleaned up review system temporary data');
  }
}

// مثيل وحيد من نظام المراجعات
export const reviewSystem = ReviewSystem.getInstance();

// دوال مساعدة
export const addReview = (reviewData: any) => reviewSystem.addReview(reviewData);
export const getProductReviews = (productId: string, filters?: ReviewFilters) => 
  reviewSystem.getProductReviews(productId, filters);
export const getProductStats = (productId: string) => reviewSystem.getProductStats(productId);
export const markAsHelpful = (reviewId: string, userId: string) => 
  reviewSystem.markAsHelpful(reviewId, userId);
export const reportReview = (reviewId: string, userId: string, reason: string) => 
  reviewSystem.reportReview(reviewId, userId, reason); 