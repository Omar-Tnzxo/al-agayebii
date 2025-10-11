import { logger } from '@/lib/utils/logger';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'promotion';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  userId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: number;
}

interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  security: boolean;
  system: boolean;
}

class NotificationSystem {
  private static instance: NotificationSystem;
  private notifications: Map<string, Notification> = new Map();
  private subscribers: Map<string, (notification: Notification) => void> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  private constructor() {
    // تنظيف الإشعارات المنتهية الصلاحية كل 30 دقيقة
    setInterval(() => this.cleanupExpiredNotifications(), 30 * 60 * 1000);
  }

  public static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  /**
   * إنشاء إشعار جديد
   */
  createNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false
    };

    this.notifications.set(id, newNotification);
    
    // إرسال للمشتركين
    this.notifySubscribers(newNotification);
    
    logger.info(`🔔 Notification created: ${notification.type} - ${notification.title}`, {
      id,
      userId: notification.userId,
      priority: notification.priority
    });

    return id;
  }

  /**
   * الاشتراك في الإشعارات
   */
  subscribe(subscriberId: string, callback: (notification: Notification) => void): void {
    this.subscribers.set(subscriberId, callback);
    logger.debug(`📡 Subscriber added: ${subscriberId}`);
  }

  /**
   * إلغاء الاشتراك
   */
  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
    logger.debug(`📡 Subscriber removed: ${subscriberId}`);
  }

  /**
   * إرسال الإشعار للمشتركين
   */
  private notifySubscribers(notification: Notification): void {
    for (const [subscriberId, callback] of this.subscribers.entries()) {
      try {
        callback(notification);
      } catch (error) {
        logger.error(`❌ Error notifying subscriber ${subscriberId}:`, error);
      }
    }
  }

  /**
   * الحصول على إشعارات المستخدم
   */
  getUserNotifications(userId?: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
    types?: Notification['type'][];
  }): Notification[] {
    const { unreadOnly = false, limit = 50, types } = options || {};
    
    let userNotifications = Array.from(this.notifications.values())
      .filter(notif => {
        if (userId) {
          return notif.userId === userId || !notif.userId;
        } else {
          return !notif.userId; // إشعارات عامة فقط
        }
      });

    if (unreadOnly) {
      userNotifications = userNotifications.filter(notif => !notif.read);
    }

    if (types?.length) {
      userNotifications = userNotifications.filter(notif => types.includes(notif.type));
    }

    return userNotifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * تحديد إشعار كمقروء
   */
  markAsRead(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.get(notificationId);
    
    if (!notification) {
      return false;
    }

    // التحقق من أن المستخدم مخول لتحديث هذا الإشعار
    if (userId && notification.userId && notification.userId !== userId) {
      return false;
    }

    notification.read = true;
    this.notifications.set(notificationId, notification);
    
    logger.debug(`📖 Notification marked as read: ${notificationId}`);
    return true;
  }

  /**
   * تحديد جميع إشعارات المستخدم كمقروءة
   */
  markAllAsRead(userId: string): number {
    let markedCount = 0;
    
    for (const [id, notification] of this.notifications.entries()) {
      if ((notification.userId === userId || !notification.userId) && !notification.read) {
        notification.read = true;
        this.notifications.set(id, notification);
        markedCount++;
      }
    }

    logger.info(`📖 Marked ${markedCount} notifications as read for user: ${userId}`);
    return markedCount;
  }

  /**
   * حذف إشعار
   */
  deleteNotification(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.get(notificationId);
    
    if (!notification) {
      return false;
    }

    // التحقق من الصلاحيات
    if (userId && notification.userId && notification.userId !== userId) {
      return false;
    }

    this.notifications.delete(notificationId);
    logger.debug(`🗑️ Notification deleted: ${notificationId}`);
    return true;
  }

  /**
   * تنظيف الإشعارات المنتهية الصلاحية
   */
  private cleanupExpiredNotifications(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`🧹 Cleaned up ${deletedCount} expired notifications`);
    }
  }

  /**
   * إحصائيات الإشعارات
   */
  getStats(): {
    totalNotifications: number;
    unreadCount: number;
    readCount: number;
    byType: Record<Notification['type'], number>;
    byPriority: Record<Notification['priority'], number>;
  } {
    const notifications = Array.from(this.notifications.values());
    
    const stats = {
      totalNotifications: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
      readCount: notifications.filter(n => n.read).length,
      byType: {} as Record<Notification['type'], number>,
      byPriority: {} as Record<Notification['priority'], number>
    };

    // إحصائيات حسب النوع
    for (const notification of notifications) {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    }

    return stats;
  }

  /**
   * تعيين تفضيلات المستخدم
   */
  setUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const currentPrefs = this.userPreferences.get(userId) || {
      email: true,
      browser: true,
      orderUpdates: true,
      promotions: true,
      security: true,
      system: false
    };

    this.userPreferences.set(userId, { ...currentPrefs, ...preferences });
    logger.debug(`⚙️ Updated notification preferences for user: ${userId}`);
  }

  /**
   * الحصول على تفضيلات المستخدم
   */
  getUserPreferences(userId: string): NotificationPreferences {
    return this.userPreferences.get(userId) || {
      email: true,
      browser: true,
      orderUpdates: true,
      promotions: true,
      security: true,
      system: false
    };
  }
}

// مثيل وحيد من نظام الإشعارات
export const notificationSystem = NotificationSystem.getInstance();

// دوال مساعدة سريعة
export const createNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string =>
  notificationSystem.createNotification(notification);

export const getUserNotifications = (userId?: string, options?: any) =>
  notificationSystem.getUserNotifications(userId, options);

export const markAsRead = (notificationId: string, userId?: string): boolean =>
  notificationSystem.markAsRead(notificationId, userId);

// إشعارات خاصة بالتجارة الإلكترونية
export const notificationTemplates = {
  newOrder: (orderId: string, customerName: string, amount: number) => ({
    type: 'order' as const,
    title: 'طلب جديد',
    message: `طلب جديد من ${customerName} بقيمة ${amount} جنيه مصري`,
    priority: 'high' as const,
    actionUrl: `/admin/orders/${orderId}`,
    metadata: { orderId, customerName, amount }
  }),

  orderStatusUpdate: (orderId: string, status: string, userId: string) => ({
    type: 'order' as const,
    title: 'تحديث حالة الطلب',
    message: `تم تحديث حالة طلبك #${orderId} إلى: ${status}`,
    priority: 'medium' as const,
    userId,
    actionUrl: `/orders/${orderId}`,
    metadata: { orderId, status }
  }),

  lowStock: (productName: string, currentStock: number) => ({
    type: 'warning' as const,
    title: 'تنبيه مخزون منخفض',
    message: `المنتج "${productName}" يحتاج تجديد مخزون (${currentStock} قطعة متبقية)`,
    priority: 'high' as const,
    actionUrl: '/admin/inventory',
    metadata: { productName, currentStock }
  }),

  newPromotion: (title: string, discount: number, userId?: string) => ({
    type: 'promotion' as const,
    title: 'عرض جديد!',
    message: `${title} - خصم ${discount}%`,
    priority: 'medium' as const,
    userId,
    actionUrl: '/products?promo=true',
    metadata: { title, discount }
  }),

  securityAlert: (message: string, userId: string) => ({
    type: 'warning' as const,
    title: 'تنبيه أمني',
    message,
    priority: 'urgent' as const,
    userId,
    metadata: { security: true }
  }),

  systemMaintenance: (message: string, scheduledTime: number) => ({
    type: 'info' as const,
    title: 'صيانة النظام',
    message,
    priority: 'medium' as const,
    expiresAt: scheduledTime + (24 * 60 * 60 * 1000), // 24 ساعة
    metadata: { scheduledTime }
  })
}; 