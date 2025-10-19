import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // استثناء صفحة تسجيل الدخول الإدارية من أي معالجة إضافية
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // حماية مسارات لوحة التحكم
  if (pathname.startsWith('/dashboard')) {
    const adminToken = request.cookies.get('admin_auth_token');
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin', request.url));
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