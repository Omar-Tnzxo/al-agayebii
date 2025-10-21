import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // استثناء صفحة تسجيل الدخول الإدارية والتسجيل الآمن
  if (pathname.startsWith('/admin') || pathname.startsWith('/s3cur3-r3g1st3r-@dm1n-2025')) {
    return NextResponse.next();
  }

  // حماية مسارات لوحة التحكم
  if (pathname.startsWith('/dashboard')) {
    const adminSession = request.cookies.get('admin_session');
    
    if (!adminSession || !adminSession.value) {
      return NextResponse.redirect(new URL('/admin?message=يرجى تسجيل الدخول أولاً', request.url));
    }

    // التحقق من صيغة الجلسة
    const sessionParts = adminSession.value.split(':');
    if (sessionParts.length !== 4) {
      const response = NextResponse.redirect(new URL('/admin?message=جلسة غير صالحة', request.url));
      response.cookies.delete('admin_session');
      return response;
    }

    // التحقق من صلاحية الجلسة (عمر الجلسة)
    const timestamp = parseInt(sessionParts[3], 10);
    const now = Date.now();
    const sessionAge = (now - timestamp) / 1000; // بالثواني
    const maxSessionAge = 60 * 60 * 24 * 7; // 7 أيام

    if (sessionAge > maxSessionAge) {
      const response = NextResponse.redirect(new URL('/admin?message=انتهت صلاحية الجلسة', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  // إضافة headers أمان شاملة
  const response = NextResponse.next();
  
  // Headers أساسية
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS في الإنتاج فقط
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  
  // منع الـ caching للصفحات الحساسة
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|api).*)',
  ],
};