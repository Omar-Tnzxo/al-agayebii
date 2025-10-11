import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleApiError = (error: any, context: string): AppError => {
  logger.error(`خطأ في ${context}:`, error);
  
  if (error instanceof AppError) {
    return error;
  }
  
  return new AppError(
    process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'حدث خطأ غير متوقع',
    500
  );
};

export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    const handledError = handleApiError(error, context);
    
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    throw handledError;
  }
};

export const safeJsonParse = (jsonString: string, fallback: any = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn('فشل في تحليل JSON:', error);
    return fallback;
  }
};

export const withErrorBoundary = <T extends any[], R>(
  fn: (...args: T) => R,
  context: string
) => {
  return (...args: T): R | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      logger.error(`خطأ في ${context}:`, error);
      return undefined;
    }
  };
}; 