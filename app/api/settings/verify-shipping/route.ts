import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - التحقق من حالة نظام شركات الشحن
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // التحقق من وجود الإعداد
    const { data: setting, error } = await supabase
      .from('site_settings')
      .select('key, value, updated_at')
      .eq('key', 'shipping_companies_enabled')
      .single();

    if (error) {
      console.error('خطأ في جلب إعداد شركات الشحن:', error);
      return NextResponse.json({ 
        error: 'خطأ في جلب الإعداد',
        details: error.message 
      }, { status: 500 });
    }

    console.log('إعداد شركات الشحن من قاعدة البيانات:', setting);

    const isEnabled = setting.value === 'true';
    
    return NextResponse.json({
      success: true,
      data: {
        key: setting.key,
        value: setting.value,
        isEnabled: isEnabled,
        updatedAt: setting.updated_at
      }
    });

  } catch (error) {
    console.error('خطأ في API التحقق من نظام شركات الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST - إعادة تعيين إعداد شركات الشحن
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { enabled } = body;

    if (enabled === undefined) {
      return NextResponse.json({ 
        error: 'حالة التفعيل مطلوبة' 
      }, { status: 400 });
    }

    console.log('إعادة تعيين إعداد شركات الشحن إلى:', enabled);

    // حذف الإعداد الحالي أولاً
    const { error: deleteError } = await supabase
      .from('site_settings')
      .delete()
      .eq('key', 'shipping_companies_enabled');

    if (deleteError) {
      console.error('خطأ في حذف الإعداد الحالي:', deleteError);
    } else {
      console.log('تم حذف الإعداد الحالي بنجاح');
    }

    // إضافة الإعداد الجديد
    const { error: insertError } = await supabase
      .from('site_settings')
      .insert([
        {
          key: 'shipping_companies_enabled',
          value: enabled ? 'true' : 'false',
          updated_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      console.error('خطأ في إضافة الإعداد الجديد:', insertError);
      return NextResponse.json({ error: 'خطأ في إضافة الإعداد' }, { status: 500 });
    }

    console.log('تم إضافة الإعداد الجديد بنجاح');

    // التحقق من الإضافة
    const { data: verifyData, error: verifyError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'shipping_companies_enabled')
      .single();

    if (verifyError) {
      console.error('خطأ في التحقق من الإضافة:', verifyError);
    } else {
      console.log('القيمة النهائية في قاعدة البيانات:', verifyData.value);
    }

    return NextResponse.json({
      success: true,
      message: `تم إعادة تعيين إعداد شركات الشحن إلى ${enabled ? 'مفعل' : 'معطل'}`,
      data: {
        enabled: enabled,
        value: enabled ? 'true' : 'false'
      }
    });

  } catch (error) {
    console.error('خطأ في API إعادة تعيين نظام شركات الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
} 