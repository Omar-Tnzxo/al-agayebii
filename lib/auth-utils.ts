// وظائف المصادقة للوحة التحكم الإدارية
import { NextRequest, NextResponse } from 'next/server';

// بيانات الدخول الثابتة للمدير
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin';
const AUTH_COOKIE_NAME = 'admin_auth_token';
const AUTH_TOKEN = 'admin_secure_token_12345'; // توكن مشفر بسيط للتخزين في الكوكيز

// التحقق من بيانات الدخول
export function verifyCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// إنشاء جلسة للمدير (للاستخدام في استجابة الخادم)
export function createAdminSession(response: NextResponse): NextResponse {
  // إضافة الكوكيز للاستجابة
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: AUTH_TOKEN,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // صلاحية التوكن 7 أيام
  });
  
  return response;
}

// إنهاء جلسة المدير (للاستخدام في استجابة الخادم)
export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

// التحقق من وجود جلسة مدير نشطة
export function isAdminAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return authCookie === AUTH_TOKEN;
} 