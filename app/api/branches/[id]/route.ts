import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Branch, UpdateBranchInput } from '@/lib/types/branch';

/**
 * GET /api/branches/[id]
 * جلب فرع محدد بواسطة ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'الفرع غير موجود'
          },
          { status: 404 }
        );
      }

      console.error('خطأ في جلب الفرع:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'فشل في جلب الفرع',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Branch
    });

  } catch (error) {
    console.error('خطأ غير متوقع في جلب الفرع:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ غير متوقع في الخادم'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/branches/[id]
 * تحديث فرع موجود
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateBranchInput> = await request.json();

    // التحقق من وجود الفرع
    const { data: existingBranch, error: fetchError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingBranch) {
      return NextResponse.json(
        {
          success: false,
          error: 'الفرع غير موجود'
        },
        { status: 404 }
      );
    }

    // إذا تم تغيير الاسم، تحقق من عدم وجود فرع آخر بنفس الاسم
    if (body.name) {
      const { data: duplicateBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('name', body.name)
        .neq('id', id)
        .single();

      if (duplicateBranch) {
        return NextResponse.json(
          {
            success: false,
            error: 'يوجد فرع آخر بنفس الاسم'
          },
          { status: 409 }
        );
      }
    }

    // تحديث الفرع
    const updateData: Partial<Branch> = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // حذف الحقول غير المسموح بتحديثها
    delete (updateData as any).id;
    delete (updateData as any).created_at;

    const { data, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث الفرع:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'فشل في تحديث الفرع',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Branch,
      message: 'تم تحديث الفرع بنجاح'
    });

  } catch (error) {
    console.error('خطأ غير متوقع في تحديث الفرع:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ غير متوقع في الخادم'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/branches/[id]
 * حذف فرع
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود الفرع
    const { data: existingBranch, error: fetchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingBranch) {
      return NextResponse.json(
        {
          success: false,
          error: 'الفرع غير موجود'
        },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود طلبات مرتبطة بالفرع
    const { data: linkedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('pickup_branch_id', id)
      .limit(1);

    if (ordersError) {
      console.error('خطأ في التحقق من الطلبات المرتبطة:', ordersError);
    }

    if (linkedOrders && linkedOrders.length > 0) {
      // لا نحذف الفرع إذا كان له طلبات، بل نعطله فقط
      const { error: deactivateError } = await supabase
        .from('branches')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (deactivateError) {
        return NextResponse.json(
          {
            success: false,
            error: 'فشل في تعطيل الفرع'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تم تعطيل الفرع بدلاً من حذفه لأن له طلبات مرتبطة',
        deactivated: true
      });
    }

    // حذف الفرع
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('خطأ في حذف الفرع:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'فشل في حذف الفرع',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الفرع بنجاح'
    });

  } catch (error) {
    console.error('خطأ غير متوقع في حذف الفرع:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ غير متوقع في الخادم'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/branches/[id]
 * تحديث حقول محددة في الفرع (نفس PUT لكن أكثر دلالة)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}
