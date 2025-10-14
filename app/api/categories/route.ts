import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - جلب جميع التصنيفات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const withCounts = searchParams.get('with_counts') === 'true';
    const type = searchParams.get('type') || '';

    let query = supabase
      .from('categories')
      .select(withCounts ? `
        *,
        products (count)
      ` : '*');

    // البحث بالاسم
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // فلترة حسب النوع (type)
    if (type) {
      query = query.eq('type', type);
    }

    // فلترة حسب الحالة
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // الترتيب حسب الترتيب المخصص ثم الاسم
    query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });

    const { data: categories, error } = await query;

    if (error) {
      console.error('خطأ في جلب التصنيفات:', error);
      return NextResponse.json(
        { 
          error: 'فشل في جلب التصنيفات', 
          details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: categories || []
    });

  } catch (error: any) {
    console.error('خطأ في API التصنيفات:', error);
    return NextResponse.json(
      { 
        error: 'خطأ داخلي في الخادم', 
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
} 

// POST - إضافة تصنيف جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type = 'other',
      description = '',
      image = '',
      is_active = true,
      sort_order = 0
    } = body;

    // تحقق من الحقول المطلوبة
    if (!name || !type) {
      return NextResponse.json({ error: 'الاسم والنوع مطلوبان' }, { status: 400 });
    }

    // تحقق من عدم تكرار الاسم أو النوع
    const { data: existingByType, error: checkTypeError } = await supabase
      .from('categories')
      .select('id, type')
      .eq('type', type)
      .maybeSingle();
    
    if (checkTypeError && checkTypeError.code !== 'PGRST116') {
      console.error('خطأ أثناء التحقق من type:', checkTypeError);
      return NextResponse.json({ 
        error: 'خطأ أثناء التحقق من التكرار', 
        details: checkTypeError.message 
      }, { status: 500 });
    }
    
    if (existingByType) {
      return NextResponse.json({ 
        error: 'نوع التصنيف (type) مستخدم من قبل. يرجى استخدام type مختلف' 
      }, { status: 409 });
    }
    
    const { data: existingByName, error: checkNameError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', name)
      .maybeSingle();
    
    if (checkNameError && checkNameError.code !== 'PGRST116') {
      console.error('خطأ أثناء التحقق من name:', checkNameError);
      return NextResponse.json({ 
        error: 'خطأ أثناء التحقق من التكرار', 
        details: checkNameError.message 
      }, { status: 500 });
    }
    
    if (existingByName) {
      return NextResponse.json({ 
        error: 'اسم التصنيف مستخدم من قبل. يرجى استخدام اسم مختلف' 
      }, { status: 409 });
    }

    // إضافة التصنيف
    const { data, error } = await supabase.from('categories').insert([
      {
        name,
        type,
        description,
        image,
        is_active,
        sort_order
      }
    ]).select().maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'فشل في إضافة التصنيف', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطأ داخلي في الخادم', details: error.message }, { status: 500 });
  }
} 

// DELETE - حذف جميع التصنيفات
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clear = searchParams.get('clear');
    if (clear === 'all') {
      const { error } = await supabase.from('categories').delete();
      if (error) {
        console.error('خطأ حذف جميع التصنيفات:', error);
        return NextResponse.json({ error: 'فشل في حذف جميع التصنيفات', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'تم حذف جميع التصنيفات بنجاح' });
    }

    // حذف مجموعة محددة
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await request.json();
      if (Array.isArray(body.types) && body.types.length > 0) {
        const { error } = await supabase.from('categories').delete().in('type', body.types);
        if (error) {
          return NextResponse.json({ error: 'فشل في حذف التصنيفات المحددة', details: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: 'تم حذف التصنيفات المحددة بنجاح' });
      }
    }
    return NextResponse.json({ error: 'طلب حذف غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطأ داخلي في الخادم', details: error.message }, { status: 500 });
  }
} 