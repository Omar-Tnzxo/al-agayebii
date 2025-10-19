/**
 * CSRF Protection - حماية من Cross-Site Request Forgery
 * 
 * يحمي من الهجمات التي تحاول تنفيذ عمليات غير مصرح بها
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * توليد CSRF token جديد
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * التحقق من CSRF token
 */
export function verifyCSRFToken(request: NextRequest): boolean {
  // استثناء GET, HEAD, OPTIONS - safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }
  
  // الحصول على token من header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  
  // الحصول على token من cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  // التحقق
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return false;
  }
  
  return true;
}

/**
 * Middleware للتحقق من CSRF
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  if (!verifyCSRFToken(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'طلب غير صالح. يرجى تحديث الصفحة والمحاولة مرة أخرى'
      },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * إضافة CSRF token إلى الاستجابة
 */
export function addCSRFTokenToResponse(response: NextResponse): NextResponse {
  const token = generateCSRFToken();
  
  // إضافة في cookie
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 ساعة
  });
  
  // إضافة في header
  response.headers.set(CSRF_TOKEN_HEADER, token);
  
  return response;
}

/**
 * التحقق من Origin header (حماية إضافية)
 */
export function verifyOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // إذا لم يكن هناك origin (مثل same-origin requests)
  if (!origin) {
    return true;
  }
  
  // التحقق من أن origin يطابق host
  try {
    const originUrl = new URL(origin);
    const expectedOrigins = [
      host,
      process.env.NEXT_PUBLIC_SITE_URL
    ].filter(Boolean);
    
    return expectedOrigins.some(expectedOrigin => {
      if (!expectedOrigin) return false;
      const expectedUrl = expectedOrigin.startsWith('http') 
        ? new URL(expectedOrigin)
        : { host: expectedOrigin };
      return originUrl.host === expectedUrl.host;
    });
  } catch {
    return false;
  }
}

/**
 * حماية شاملة (CSRF + Origin)
 */
export async function comprehensiveProtection(request: NextRequest): Promise<NextResponse | null> {
  // التحقق من Origin أولاً
  if (!verifyOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'طلب من مصدر غير موثوق'
      },
      { status: 403 }
    );
  }
  
  // ثم التحقق من CSRF
  return csrfProtection(request);
}

export default {
  generateCSRFToken,
  verifyCSRFToken,
  csrfProtection,
  addCSRFTokenToResponse,
  verifyOrigin,
  comprehensiveProtection
};
