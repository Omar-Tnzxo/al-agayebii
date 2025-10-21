import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { setAdminSession } from '@/lib/auth-utils';
import { z } from 'zod';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'بيانات الدخول غير صحيحة' },
        { status: 400 }
      );
    }
    
    const { email, password } = validation.data;
    
    // Get IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Verify password using stored function
    const { data: result, error } = await supabase.rpc('verify_admin_password', {
      p_email: email,
      p_password: password,
      p_ip_address: clientIP.substring(0, 45),
      p_user_agent: userAgent.substring(0, 255)
    });

    if (error) {
      console.error('❌ خطأ في verify_admin_password:', error);
      return NextResponse.json(
        { success: false, message: 'حدث خطأ في معالجة الطلب' },
        { status: 500 }
      );
    }

    // result is an array with one object
    const authResult = result?.[0];
    
    if (!authResult || !authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult?.message || 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Create response with admin data
    const adminUser = {
      id: authResult.admin_id,
      email: email,
      role: authResult.role,
    };

    const response = NextResponse.json({
      success: true,
      message: authResult.message,
      adminUser,
    });

    // Set secure session cookie
    setAdminSession(response, adminUser);

    console.log('✅ تم تسجيل الدخول بنجاح:', email);
    return response;
    
  } catch (error: any) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}