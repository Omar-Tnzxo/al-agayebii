import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // جلب شركات الشحن النشطة فقط
    const { data: shippingCompanies, error } = await supabase
      .from('shipping_companies')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('خطأ في جلب شركات الشحن:', error);
      return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: shippingCompanies 
    });

  } catch (error) {
    console.error('خطأ في API شركات الشحن العامة:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
} 