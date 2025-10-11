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

  // إضافة headers أمان أساسية
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|api).*)',
  ],
}; 