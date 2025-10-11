import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = await params;

    // جلب شركة الشحن المحددة
    const { data: shippingCompany, error } = await supabase
      .from('shipping_companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('خطأ في جلب شركة الشحن:', error);
      return NextResponse.json({ error: 'شركة الشحن غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: shippingCompany
    });

  } catch (error) {
    console.error('خطأ في API جلب شركة الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = await params;

    const body = await request.json();
    
    // إضافة logging للتأكد من البيانات المرسلة
    console.log('🔍 البيانات المرسلة لتحديث شركة الشحن:', {
      id,
      logo_url: body.logo_url,
      logo_path: body.logo_path,
      name: body.name
    });
    
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

    // التحقق من البيانات المطلوبة - السماح بتحديث جزئي
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // إضافة الحقول فقط إذا تم تمريرها
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (logo_path !== undefined) updateData.logo_path = logo_path;
    if (base_shipping_cost !== undefined) updateData.base_shipping_cost = parseFloat(base_shipping_cost);
    if (free_shipping_threshold !== undefined) updateData.free_shipping_threshold = parseFloat(free_shipping_threshold);
    if (is_default !== undefined) updateData.is_default = is_default;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (delivery_time_min !== undefined) updateData.delivery_time_min = delivery_time_min;
    if (delivery_time_max !== undefined) updateData.delivery_time_max = delivery_time_max;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (terms_conditions !== undefined) updateData.terms_conditions = terms_conditions;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // إضافة logging لبيانات التحديث
    console.log('🔧 بيانات التحديث المرسلة إلى قاعدة البيانات:', {
      logo_url: updateData.logo_url,
      logo_path: updateData.logo_path
    });

    // تحديث شركة الشحن
    const { data: updatedCompany, error } = await supabase
      .from('shipping_companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في تحديث شركة الشحن:', error);
      return NextResponse.json({ error: 'خطأ في تحديث البيانات' }, { status: 500 });
    }

    // إضافة logging للنتيجة
    console.log('✅ تم تحديث شركة الشحن بنجاح:', {
      id: updatedCompany.id,
      logo_url: updatedCompany.logo_url,
      logo_path: updatedCompany.logo_path
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedCompany,
      message: 'تم تحديث شركة الشحن بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في API تحديث شركة الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = await params;

    // التحقق من أن الشركة ليست افتراضية
    const { data: company } = await supabase
      .from('shipping_companies')
      .select('is_default')
      .eq('id', id)
      .single();

    if (company?.is_default) {
      return NextResponse.json({ 
        error: 'لا يمكن حذف الشركة الافتراضية' 
      }, { status: 400 });
    }

    // حذف شركة الشحن
    const { error } = await supabase
      .from('shipping_companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('خطأ في حذف شركة الشحن:', error);
      return NextResponse.json({ error: 'خطأ في حذف البيانات' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف شركة الشحن بنجاح'
    });

  } catch (error) {
    console.error('خطأ في API حذف شركة الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
} 