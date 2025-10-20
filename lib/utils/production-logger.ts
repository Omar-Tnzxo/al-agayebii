/**
 * Production-Safe Logger
 * يمنع طباعة معلومات حساسة في production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: any;
}

/**
 * فلترة البيانات الحساسة
 */
function sanitizeData(data: LogData): LogData {
  const sensitiveKeys = [
    'password', 
    'token', 
    'key', 
    'secret', 
    'authorization',
    'cookie',
    'session',
    'apiKey',
    'api_key',
    'anon_key',
    'service_role_key'
  ];

  const sanitized: LogData = {};

  for (const [key, value] of Object.entries(data)) {
    // فحص إذا كان المفتاح حساساً
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );

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

/**
 * Logger آمن للاستخدام في production
 */
class ProductionSafeLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, data?: LogData) {
    // في production: فقط الأخطاء الحرجة
    if (this.isProduction && level === 'debug') {
      return;
    }

    // في production: نظف البيانات الحساسة
    const cleanData = data ? sanitizeData(data) : undefined;

    // في development: اطبع كل شيء
    if (this.isDevelopment) {
      switch (level) {
        case 'info':
          console.info(`ℹ️ ${message}`, cleanData || '');
          break;
        case 'warn':
          console.warn(`⚠️ ${message}`, cleanData || '');
          break;
        case 'error':
          console.error(`❌ ${message}`, cleanData || '');
          break;
        case 'debug':
          console.debug(`🔍 ${message}`, cleanData || '');
          break;
      }
    } else {
      // في production: استخدم format أبسط
      if (level === 'error') {
        console.error(`[${new Date().toISOString()}] ${message}`, cleanData || '');
      }
    }
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData) {
    this.log('error', message, data);
  }

  debug(message: string, data?: LogData) {
    this.log('debug', message, data);
  }

  /**
   * لا تطبع أبداً - مخصص للبيانات الحساسة جداً
   */
  sensitive(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.debug(`🔒 [SENSITIVE] ${message}`, '***DATA HIDDEN***');
    }
    // في production: لا تطبع أبداً
  }
}

// Export singleton instance
export const productionLogger = new ProductionSafeLogger();

// Default export
export default productionLogger;
