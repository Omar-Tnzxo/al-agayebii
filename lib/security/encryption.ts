import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'your-secret-key-here-change-this-in-production';

class EncryptionService {
  private static instance: EncryptionService;
  private secretKey: Buffer;

  private constructor() {
    // إنشاء مفتاح تشفير من السر
    this.secretKey = crypto.scryptSync(SECRET_KEY, 'salt', 32);
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * تشفير النص
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(ALGORITHM, this.secretKey);
      cipher.setAAD(Buffer.from('Al-Agayebi-Store', 'utf8'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();
      
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('❌ خطأ في تشفير البيانات:', error);
      throw new Error('فشل في تشفير البيانات');
    }
  }

  /**
   * فك تشفير النص
   */
  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('تنسيق البيانات المشفرة غير صحيح');
      }

      const [ivHex, tagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipher(ALGORITHM, this.secretKey);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from('Al-Agayebi-Store', 'utf8'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('❌ خطأ في فك تشفير البيانات:', error);
      throw new Error('فشل في فك تشفير البيانات');
    }
  }

  /**
   * إنشاء hash آمن للبيانات
   */
  hash(data: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, saltToUse, 10000, 64, 'sha512');
    return `${saltToUse}:${hash.toString('hex')}`;
  }

  /**
   * التحقق من صحة hash
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
      return hash === verifyHash.toString('hex');
    } catch (error) {
      logger.error('❌ خطأ في التحقق من hash:', error);
      return false;
    }
  }

  /**
   * إنشاء token عشوائي آمن
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * إنشاء UUID
   */
  generateUUID(): string {
    return crypto.randomUUID();
  }
}

// مثيل وحيد من خدمة التشفير
export const encryption = EncryptionService.getInstance();

// دوال مساعدة للاستخدام السريع
export const encryptSensitiveData = (data: string): string => encryption.encrypt(data);
export const decryptSensitiveData = (encryptedData: string): string => encryption.decrypt(encryptedData);
export const hashPassword = (password: string): string => encryption.hash(password);
export const verifyPassword = (password: string, hashedPassword: string): boolean => 
  encryption.verifyHash(password, hashedPassword);
export const generateToken = (length?: number): string => encryption.generateSecureToken(length);
export const generateOrderId = (): string => encryption.generateUUID();

// دالة تشفير معلومات العملاء للتخزين الآمن
export const encryptCustomerData = (customerData: {
  name: string;
  phone: string;
  email?: string;
  address: string;
}): string => {
  return encryption.encrypt(JSON.stringify(customerData));
};

// دالة فك تشفير معلومات العملاء
export const decryptCustomerData = (encryptedData: string): {
  name: string;
  phone: string;
  email?: string;
  address: string;
} => {
  const decryptedString = encryption.decrypt(encryptedData);
  return JSON.parse(decryptedString);
};

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  // إزالة HTML tags والأحرف الخطيرة
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[\/\!]*?[^<>]*?>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const sanitizeEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeInput(email.toLowerCase());
  return emailRegex.test(sanitized) ? sanitized : '';
};

export const sanitizePhone = (phone: string): string => {
  // إزالة كل شيء عدا الأرقام والرموز المسموحة
  return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
}; 