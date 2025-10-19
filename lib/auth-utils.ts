/**
 * Auth Utils - وظائف مساعدة للمصادقة
 * تُستخدم في API routes
 */

import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'admin_auth_token';
const AUTH_TOKEN = 'admin_secure_token_12345';

/**
 * إنشاء جلسة للمدير
 */
export function createAdminSession(response: NextResponse): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: AUTH_TOKEN,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 أيام
  });
  
  return response;
}

/**
 * إنهاء جلسة المدير
 */
export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

/**
 * التحقق من وجود جلسة مدير نشطة
 */
export function isAdminAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return authCookie === AUTH_TOKEN;
}

export default {
  createAdminSession,
  clearAdminSession,
  isAdminAuthenticated
};
