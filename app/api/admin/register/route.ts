import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Validation Schema
const registerSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
  invitationCode: z.string().length(6, 'كود الدعوة يجب أن يكون 6 أرقام'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 طلب التسجيل:', { email: body.email });
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ فشل التحقق:', validation.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: validation.error.errors[0]?.message || 'بيانات غير صحيحة'
        },
        { status: 400 }
      );
    }

    const { email, password, invitationCode, phone } = validation.data;

    // 1. Verify invitation code FIRST
    console.log('🔍 التحقق من كود الدعوة:', invitationCode);
    console.log('🔍 نوع البيانات:', typeof invitationCode);
    console.log('🔍 طول الكود:', invitationCode?.length);
    
    const { data: invitationData, error: invitationError } = await supabase
      .from('admin_invitation_codes')
      .select('*')
      .eq('code', invitationCode)
      .eq('is_used', false)
      .maybeSingle();

    console.log('📋 بيانات كود الدعوة:', invitationData);
    console.log('📋 خطأ في جلب الكود:', invitationError);

    if (invitationError) {
      console.error('❌ خطأ في قاعدة البيانات:', invitationError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'خطأ في التحقق من كود الدعوة',
          details: invitationError.message 
        },
        { status: 500 }
      );
    }

    if (!invitationData) {
      // Check if code exists but is used
      const { data: usedCode } = await supabase
        .from('admin_invitation_codes')
        .select('*')
        .eq('code', invitationCode)
        .maybeSingle();
      
      console.log('📋 التحقق من كود مستخدم:', usedCode);
      
      return NextResponse.json(
        { 
          success: false, 
          message: usedCode ? 'كود الدعوة مستخدم بالفعل' : 'كود الدعوة غير صالح',
          debug: { codeFound: !!usedCode, isUsed: usedCode?.is_used }
        },
        { status: 400 }
      );
    }

    if (invitationData.expires_at && new Date(invitationData.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'كود الدعوة منتهي الصلاحية' },
        { status: 400 }
      );
    }

    if (invitationData.current_uses >= invitationData.max_uses) {
      return NextResponse.json(
        { success: false, message: 'تم استنفاذ عدد استخدامات كود الدعوة' },
        { status: 400 }
      );
    }

    // 2. Check if email exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // 3. Create admin using stored function
    const { data: adminId, error: createError } = await supabase
      .rpc('create_admin_user', {
        p_email: email,
        p_password: password,
        p_role: 'super_admin',
        p_phone: phone || null
      });

    if (createError) {
      console.error('❌ خطأ في create_admin_user:', createError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'فشل إنشاء الحساب',
          details: createError.message
        },
        { status: 500 }
      );
    }

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: 'فشل إنشاء الحساب' },
        { status: 500 }
      );
    }

    // 4. Use invitation code
    const { data: codeUsed, error: codeError } = await supabase.rpc('use_invitation_code', {
      p_code: invitationCode,
      p_used_by: adminId
    });

    if (codeError || !codeUsed) {
      console.error('❌ خطأ في استخدام كود الدعوة:', codeError);
      // Delete created admin if code update fails
      await supabase.from('admin_users').delete().eq('id', adminId);
      
      return NextResponse.json(
        { success: false, message: 'فشل استخدام كود الدعوة' },
        { status: 500 }
      );
    }

    // 5. Get admin data
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', adminId)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { success: false, message: 'فشل جلب بيانات الحساب' },
        { status: 500 }
      );
    }

    // 6. Create session
    const response = NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      adminUser: adminData
    });

    response.cookies.set({
      name: 'admin_session',
      value: `${adminData.id}:${adminData.email}:${adminData.role}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    console.log('✅ تم إنشاء الحساب بنجاح');
    return response;

  } catch (error: any) {
    console.error('❌ خطأ:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'حدث خطأ في إنشاء الحساب'
      },
      { status: 500 }
    );
  }
}
