import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Simple auth check from cookie
function getAdminFromCookie(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return null;
  
  const [userId, email, role] = cookie.split(':');
  return { userId, email, role };
}

// Validation Schema
const createAdminSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  role: z.enum(['admin', 'super_admin', 'manager']).default('admin'),
  phone: z.string().optional(),
});

const updateAdminSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'super_admin', 'manager']).optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET - List all admins
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = getAdminFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // Get all admin users
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active, phone, created_at, updated_at, last_login, failed_login_attempts')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      admins: admins || [],
    });

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('خطأ في جلب المديرين:', error);
    }
    
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = getAdminFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // Only super_admin can create new admins
    if (session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بإنشاء مديرين جدد' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = createAdminSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'بيانات غير صحيحة',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { email, password, role, phone } = validation.data;

    // Check if email already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Create admin using database function
    const { data: adminId, error } = await supabase.rpc('create_admin_user', {
      p_email: email,
      p_password: password,
      p_role: role,
    });

    if (error) {
      throw error;
    }

    // Update phone if provided
    if (phone && adminId) {
      await supabase
        .from('admin_users')
        .update({ phone })
        .eq('id', adminId);
    }

    // Get the created admin details
    const { data: newAdmin } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active, phone, created_at')
      .eq('id', adminId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المدير بنجاح',
      admin: newAdmin,
    });

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('خطأ في إنشاء المدير:', error);
    }
    
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إنشاء المدير' },
      { status: 500 }
    );
  }
}

// PUT - Update admin
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const session = getAdminFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = updateAdminSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'بيانات غير صحيحة',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validation.data;

    // Only super_admin can update other admins
    if (session.role !== 'super_admin' && session.userId !== id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل هذا المدير' },
        { status: 403 }
      );
    }

    // Get the oldest admin (primary account)
    const { data: oldestAdmin, error: oldestError } = await supabase
      .from('admin_users')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (oldestError) {
      throw oldestError;
    }

    // Prevent deactivating the primary admin account
    if (oldestAdmin && oldestAdmin.id === id && updateData.is_active === false) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعطيل الحساب الأساسي للموقع' },
        { status: 403 }
      );
    }

    // Update admin
    const { data: updatedAdmin, error } = await supabase
      .from('admin_users')
      .update({ 
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, role, is_active, phone, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث المدير بنجاح',
      admin: updatedAdmin,
    });

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('خطأ في تحديث المدير:', error);
    }
    
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحديث المدير' },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = getAdminFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // Only super_admin can delete admins
    if (session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف المديرين' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المدير مطلوب' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (session.userId === id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    // Get the oldest admin (primary account)
    const { data: oldestAdmin, error: oldestError } = await supabase
      .from('admin_users')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (oldestError) {
      throw oldestError;
    }

    // Prevent deleting the primary admin account
    if (oldestAdmin && oldestAdmin.id === id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الحساب الأساسي للموقع' },
        { status: 403 }
      );
    }

    // Get target admin and current admin details
    const [targetAdminResult, currentAdminResult] = await Promise.all([
      supabase.from('admin_users').select('created_at').eq('id', id).single(),
      supabase.from('admin_users').select('created_at').eq('id', session.userId).single()
    ]);

    const { data: targetAdmin } = targetAdminResult;
    const { data: currentAdmin } = currentAdminResult;

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: 'المدير المراد حذفه غير موجود' },
        { status: 404 }
      );
    }

    // Prevent deleting admins created before you
    if (currentAdmin && new Date(targetAdmin.created_at) < new Date(currentAdmin.created_at)) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف مدير تم إنشاؤه قبلك' },
        { status: 403 }
      );
    }

    // Soft delete - deactivate instead of deleting
    const { error } = await supabase
      .from('admin_users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'تم تعطيل المدير بنجاح',
    });

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('خطأ في حذف المدير:', error);
    }
    
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في حذف المدير' },
      { status: 500 }
    );
  }
}
