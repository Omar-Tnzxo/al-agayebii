import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API لحساب تكلفة الشحن المبسط
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const subtotal = parseFloat(searchParams.get('subtotal') || '0');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'معرف شركة الشحن مطلوب' },
        { status: 400 }
      );
    }

    // جلب بيانات شركة الشحن
    const { data: company, error: companyError } = await supabase
      .from('shipping_companies')
      .select(`
        id,
        name,
        base_shipping_cost,
        free_shipping_threshold,
        is_active
      `)
      .eq('id', companyId)
      .eq('is_active', true)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'شركة الشحن غير موجودة أو غير نشطة' },
        { status: 404 }
      );
    }

    // حساب تكلفة الشحن
    const freeShippingThreshold = company.free_shipping_threshold || 500;
    let finalShippingCost = company.base_shipping_cost;
    let isFreeShipping = false;

    if (subtotal >= freeShippingThreshold) {
      finalShippingCost = 0;
      isFreeShipping = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        shipping_cost: finalShippingCost,
        original_shipping_cost: company.base_shipping_cost,
        is_free_shipping: isFreeShipping,
        free_shipping_threshold: freeShippingThreshold,
        company_name: company.name,
        subtotal,
        total: subtotal + finalShippingCost,
        savings: isFreeShipping ? company.base_shipping_cost : 0
      }
    });

  } catch (error) {
    console.error('خطأ في حساب تكلفة الشحن:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}