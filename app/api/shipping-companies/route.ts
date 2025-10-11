import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleApiResponse } from '@/lib/utils/handle-api-response';

export async function GET(request: NextRequest) {
  try {
    // جلب شركات الشحن النشطة فقط
    const { data: shippingCompanies, error } = await supabase
      .from('shipping_companies')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('خطأ في جلب شركات الشحن:', error);
      return NextResponse.json(
        { error: 'فشل في جلب شركات الشحن' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shippingCompanies || []
    });

  } catch (error) {
    console.error('خطأ عام في API شركات الشحن:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      logo_url,
      logo_path,
      base_shipping_cost,
      free_shipping_threshold,
      is_default,
      is_active,
      delivery_time_min,
      delivery_time_max,
      contact_phone,
      contact_email,
      website_url,
      terms_conditions,
      sort_order
    } = body;

    // التحقق من البيانات المطلوبة
    if (!name || base_shipping_cost === undefined) {
      return NextResponse.json({
        error: 'الاسم وسعر الشحن الأساسي مطلوبان'
      }, { status: 400 });
    }

    // إدراج شركة شحن جديدة
    const { data: newCompany, error } = await supabase
      .from('shipping_companies')
      .insert({
        name,
        description,
        logo_url,
        logo_path,
        base_shipping_cost: parseFloat(base_shipping_cost),
        free_shipping_threshold: parseFloat(free_shipping_threshold || 500),
        is_default: is_default || false,
        is_active: is_active !== false,
        delivery_time_min: delivery_time_min || 1,
        delivery_time_max: delivery_time_max || 3,
        contact_phone,
        contact_email,
        website_url,
        terms_conditions,
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) {
      console.error('خطأ في إدراج شركة الشحن:', error);
      return NextResponse.json({ error: 'خطأ في حفظ البيانات' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newCompany,
      message: 'تم إضافة شركة الشحن بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API إضافة شركة الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
} 