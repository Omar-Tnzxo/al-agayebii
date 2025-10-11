import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - جلب عرض محدد
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('خطأ في جلب العرض:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'العرض غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ promotion: data });
  } catch (error: any) {
    console.error('خطأ غير متوقع في جلب العرض:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - تحديث عرض محدد
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const promotion = await request.json();

    // التحقق من وجود البيانات المطلوبة
    if (!promotion.title) {
      return NextResponse.json({ error: 'عنوان العرض مطلوب' }, { status: 400 });
    }

    if (promotion.title.length > 255) {
      return NextResponse.json({ error: 'عنوان العرض يجب ألا يتجاوز 255 حرف' }, { status: 400 });
    }

    if (promotion.url && promotion.url.length > 255) {
      return NextResponse.json({ error: 'رابط العرض يجب ألا يتجاوز 255 حرف' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('promotions')
      .update({
        title: promotion.title,
        description: promotion.description,
        image_url: promotion.image_url,
        url: promotion.url,
        start_date: promotion.start_date,
        end_date: promotion.end_date,
        is_active: promotion.is_active,
        priority: promotion.priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث العرض:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'العرض غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ promotion: data });
  } catch (error: any) {
    console.error('خطأ غير متوقع في تحديث العرض:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - حذف عرض محدد
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('خطأ في حذف العرض:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف العرض بنجاح' });
  } catch (error: any) {
    console.error('خطأ غير متوقع في حذف العرض:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}