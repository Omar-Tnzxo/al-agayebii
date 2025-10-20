import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminAuthentication } from '@/lib/security/secure-auth';
import { z } from 'zod';

// Password strength validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Validation Schema
const changePasswordSchema = z.object({
  adminId: z.string().uuid(),
  oldPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل'),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

// POST - Change admin password
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifyAdminAuthentication(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        { 
          success: false, 
          error: firstError.message || 'بيانات غير صحيحة'
        },
        { status: 400 }
      );
    }

    const { adminId, oldPassword, newPassword } = validation.data;

    // Check permissions
    const isSelf = session.userId === adminId;
    const isSuperAdmin = session.role === 'super_admin';

    if (!isSelf && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتغيير كلمة المرور' },
        { status: 403 }
      );
    }

    // Get admin details
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email, role, phone, is_active')
      .eq('id', adminId)
      .single();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'المدير غير موجود' },
        { status: 404 }
      );
    }

    // If changing own password, verify old password is required
    if (isSelf && !oldPassword) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور القديمة مطلوبة للتحقق من هويتك' },
        { status: 400 }
      );
    }

    // If changing own password, verify old password
    if (isSelf && oldPassword) {
      const { data: matched } = await supabase.rpc('check_admin_password', {
        p_email: admin.email,
        p_password: oldPassword,
      });

      if (!matched) {
        return NextResponse.json(
          { success: false, error: 'كلمة المرور القديمة غير صحيحة' },
          { status: 400 }
        );
      }

      // Use change_admin_password function
      const { data: success, error } = await supabase.rpc('change_admin_password', {
        p_email: admin.email,
        p_old_password: oldPassword,
        p_new_password: newPassword,
      });

      if (error || !success) {
        if (process.env.NODE_ENV === 'development') {
          console.error('خطأ في تغيير كلمة المرور:', error);
        }
        return NextResponse.json(
          { success: false, error: 'فشل تغيير كلمة المرور، تأكد من صحة كلمة المرور القديمة' },
          { status: 400 }
        );
      }
    } else if (isSuperAdmin) {
      // Super admin can reset password without old password
      // Delete old admin and recreate with new password
      await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      // Create new with same email but new password
      const { error: createError } = await supabase.rpc('create_admin_user', {
        p_email: admin.email,
        p_password: newPassword,
        p_role: admin.role || 'admin',
      });

      if (createError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('خطأ في إعادة إنشاء المدير:', createError);
        }
        return NextResponse.json(
          { success: false, error: 'فشل في إعادة تعيين كلمة المرور' },
          { status: 500 }
        );
      }

      // Update phone and status if needed
      await supabase
        .from('admin_users')
        .update({ 
          phone: admin.phone,
          is_active: admin.is_active 
        })
        .eq('email', admin.email);
    } else {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور القديمة مطلوبة' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('خطأ في تغيير كلمة المرور:', error);
    }
    
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تغيير كلمة المرور' },
      { status: 500 }
    );
  }
}
