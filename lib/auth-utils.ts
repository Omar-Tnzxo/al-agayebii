/**
 * Auth Utils - وظائف مساعدة للمصادقة
 * تُستخدم في API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 أيام بالثواني

export interface AdminSessionData {
  id: string;
  email: string;
  role: string;
  createdAt: number;
}

/**
 * إنشاء جلسة للمدير مع بيانات كاملة
 */
export function setAdminSession(
  response: NextResponse,
  adminData: { id: string; email: string; role: string }
): NextResponse {
  const sessionValue = `${adminData.id}:${adminData.email}:${adminData.role}:${Date.now()}`;
  
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION
  });
  
  return response;
}

/**
 * الحصول على بيانات جلسة المدير من الكوكي
 */
export function getAdminSession(request: NextRequest): AdminSessionData | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!cookie) return null;
  
  try {
    const parts = cookie.split(':');
    if (parts.length !== 4) return null;
    
    const [id, email, role, timestamp] = parts;
    const createdAt = parseInt(timestamp, 10);
    
    // التحقق من صلاحية الجلسة (لم تنتهي)
    const now = Date.now();
    const sessionAge = (now - createdAt) / 1000; // بالثواني
    
    if (sessionAge > SESSION_DURATION) {
      return null; // الجلسة منتهية
    }
    
    return { id, email, role, createdAt };
  } catch (error) {
    console.error('خطأ في تحليل جلسة المدير:', error);
    return null;
  }
}

/**
 * التحقق من صلاحية جلسة المدير في قاعدة البيانات
 */
export async function verifyAdminSession(
  sessionData: AdminSessionData
): Promise<{ valid: boolean; message?: string }> {
  try {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', sessionData.id)
      .eq('email', sessionData.email)
      .single();

    if (error || !admin) {
      return { valid: false, message: 'الحساب غير موجود' };
    }

    if (!admin.is_active) {
      return { valid: false, message: 'تم تعطيل حسابك' };
    }

    // التحقق من تطابق الدور
    if (admin.role !== sessionData.role) {
      return { valid: false, message: 'تغيرت صلاحيات الحساب' };
    }

    return { valid: true };
  } catch (error) {
    console.error('خطأ في التحقق من جلسة المدير:', error);
    return { valid: false, message: 'حدث خطأ في التحقق من الجلسة' };
  }
}

/**
 * تحديث وقت انتهاء جلسة المدير
 */
export function refreshAdminSession(
  response: NextResponse,
  sessionData: AdminSessionData
): NextResponse {
  const newSessionValue = `${sessionData.id}:${sessionData.email}:${sessionData.role}:${Date.now()}`;
  
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: newSessionValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION
  });
  
  return response;
}

/**
 * إنهاء جلسة المدير - حذف الكوكي بشكل كامل
 */
export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0 // حذف فوري
  });
  
  return response;
}

/**
 * التحقق من مصادقة المدير (يستخدم في API routes)
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<{ authorized: boolean; admin?: AdminSessionData; error?: string }> {
  const sessionData = getAdminSession(request);
  
  if (!sessionData) {
    return { authorized: false, error: 'لا توجد جلسة نشطة' };
  }
  
  const verification = await verifyAdminSession(sessionData);
  
  if (!verification.valid) {
    return { authorized: false, error: verification.message };
  }
  
  return { authorized: true, admin: sessionData };
}

export default {
  setAdminSession,
  getAdminSession,
  verifyAdminSession,
  refreshAdminSession,
  clearAdminSession,
  requireAdminAuth
};
