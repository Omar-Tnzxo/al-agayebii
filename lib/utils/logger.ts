const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * قائمة الكلمات الحساسة التي يجب إخفاؤها
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'apikey',
  'api_key',
  'private',
  'email'
];

/**
 * فلترة البيانات الحساسة من الـ logs
 */
function sanitizeData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sensitive => keyLower.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export interface LogLevel {
  INFO: 'info';
  ERROR: 'error';
  WARN: 'warn';
  DEBUG: 'debug';
}

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment && !isTest) {
      const sanitized = data ? sanitizeData(data) : '';
      console.log(`ℹ️ ${message}`, sanitized);
    }
  },
  
  error: (message: string, error?: any) => {
    // الأخطاء تظهر دائماً لكن بدون بيانات حساسة
    const sanitized = error ? sanitizeData(error) : '';
    console.error(`❌ ${message}`, sanitized);
    // TODO: إضافة external logging service هنا مثل Sentry
  },
  
  warn: (message: string, data?: any) => {
    // التحذيرات تظهر دائماً
    const sanitized = data ? sanitizeData(data) : '';
    console.warn(`⚠️ ${message}`, sanitized);
  },
  
  debug: (message: string, data?: any) => {
    if (isDevelopment && !isTest) {
      const sanitized = data ? sanitizeData(data) : '';
      console.debug(`🐛 ${message}`, sanitized);
    }
  },
  
  success: (message: string, data?: any) => {
    if (isDevelopment && !isTest) {
      const sanitized = data ? sanitizeData(data) : '';
      console.log(`✅ ${message}`, sanitized);
    }
  },
  
  security: (event: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const sanitized = data ? sanitizeData(data) : {};
    // الأحداث الأمنية تُسجل دائماً
    console.error(`🔒 [SECURITY] ${timestamp} - ${event}`, sanitized);
  }
};

// Helper function للبيئة الإنتاجية
export const logError = (error: Error, context?: string) => {
  const sanitized = sanitizeData(error);
  logger.error(`خطأ في ${context || 'النظام'}:`, sanitized);
  // TODO: في الإنتاج، يمكن إرسال الخطأ لخدمة مراقبة خارجية (Sentry, LogRocket)
};

export default logger;