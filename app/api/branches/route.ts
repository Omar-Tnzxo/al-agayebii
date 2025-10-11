import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Branch, CreateBranchInput } from '@/lib/types/branch';

/**
 * GET /api/branches
 * جلب جميع الفروع أو الفروع النشطة فقط
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('branches')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    // إذا طلب الفروع النشطة فقط
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('خطأ في جلب الفروع:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'فشل في جلب الفروع',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Branch[],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('خطأ غير متوقع في جلب الفروع:', error);
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
 * POST /api/branches
 * إنشاء فرع جديد
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateBranchInput = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.name || !body.address) {
      return NextResponse.json(
        {
          success: false,
          error: 'الاسم والعنوان مطلوبان'
        },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود فرع بنفس الاسم
    const { data: existingBranch } = await supabase
      .from('branches')
      .select('id')
      .eq('name', body.name)
      .single();

    if (existingBranch) {
      return NextResponse.json(
        {
          success: false,
          error: 'يوجد فرع بنفس الاسم بالفعل'
        },
        { status: 409 }
      );
    }

    // إنشاء الفرع الجديد
    const newBranch: Partial<Branch> = {
      name: body.name,
      address: body.address,
      city: body.city || undefined,
      phone: body.phone || undefined,
      email: body.email || undefined,
      working_hours: body.working_hours || undefined,
      google_maps_url: body.google_maps_url || undefined,
      map_embed_url: body.map_embed_url || undefined,
      notes: body.notes || undefined,
      is_active: body.is_active !== undefined ? body.is_active : true,
      sort_order: body.sort_order || 0,
      image_url: body.image_url || undefined,
      latitude: body.latitude || undefined,
      longitude: body.longitude || undefined
    };

    const { data, error } = await supabase
      .from('branches')
      .insert(newBranch)
      .select()
      .single();

    if (error) {
      console.error('خطأ في إنشاء الفرع:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'فشل في إنشاء الفرع',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Branch,
      message: 'تم إنشاء الفرع بنجاح'
    }, { status: 201 });

  } catch (error) {
    console.error('خطأ غير متوقع في إنشاء الفرع:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ غير متوقع في الخادم'
      },
      { status: 500 }
    );
  }
}
