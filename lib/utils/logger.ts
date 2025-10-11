const isDevelopment = process.env.NODE_ENV === 'development';

export interface LogLevel {
  INFO: 'info';
  ERROR: 'error';
  WARN: 'warn';
  DEBUG: 'debug';
}

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error || '');
    }
    // يمكن إضافة external logging service هنا مثل Sentry
  },
  
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  },
  
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`🐛 ${message}`, data || '');
    }
  },
  
  success: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data || '');
    }
  }
};

// Helper function للبيئة الإنتاجية
export const logError = (error: Error, context?: string) => {
  if (isDevelopment) {
    logger.error(`خطأ في ${context || 'النظام'}:`, error);
  } else {
    // في الإنتاج، يمكن إرسال الخطأ لخدمة مراقبة خارجية
    // مثل Sentry أو LogRocket
  }
}; 