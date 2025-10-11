import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - جلب إعدادات نظام شركات الشحن
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // جلب إعدادات نظام شركات الشحن
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'shipping_companies_enabled',
        'default_shipping_cost',
        'default_free_shipping_threshold'
      ]);

    if (error) {
      console.error('خطأ في جلب إعدادات نظام شركات الشحن:', error);
      return NextResponse.json({ error: 'خطأ في جلب الإعدادات' }, { status: 500 });
    }

    console.log('البيانات المحملة من قاعدة البيانات:', settings);

    // تحويل البيانات إلى كائن
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    console.log('الكائن المحول:', settingsObject);

    const result = {
      success: true,
      data: {
        shipping_companies_enabled: settingsObject.shipping_companies_enabled === 'true',
        default_shipping_cost: parseFloat(settingsObject.default_shipping_cost || '25'),
        default_free_shipping_threshold: parseFloat(settingsObject.default_free_shipping_threshold || '500')
      }
    };

    console.log('النتيجة النهائية:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('خطأ في API إعدادات نظام شركات الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// PUT - تحديث إعدادات نظام شركات الشحن
export async function PUT(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'خطأ في إعدادات قاعدة البيانات' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    console.log('بيانات الطلب المستلمة:', body);
    
    const {
      shipping_companies_enabled,
      default_shipping_cost,
      default_free_shipping_threshold
    } = body;

    // التحقق من البيانات المطلوبة
    if (shipping_companies_enabled === undefined) {
      return NextResponse.json({ 
        error: 'حالة تفعيل شركات الشحن مطلوبة' 
      }, { status: 400 });
    }

    console.log('حالة النظام المراد حفظها:', shipping_companies_enabled);
    console.log('نوع البيانات:', typeof shipping_companies_enabled);

    // تحويل القيمة إلى نص بشكل صريح
    const enabledValue = shipping_companies_enabled ? 'true' : 'false';
    console.log('القيمة المحولة:', enabledValue);

    // تحديث إعداد شركات الشحن فقط أولاً
    const { error: updateError } = await supabase
      .from('site_settings')
      .upsert([
        {
          key: 'shipping_companies_enabled',
          value: enabledValue,
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'key' });

    if (updateError) {
      console.error('خطأ في تحديث إعدادات نظام شركات الشحن:', updateError);
      return NextResponse.json({ error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
    }

    console.log('تم تحديث إعداد شركات الشحن بنجاح');

    // التحقق من أن التحديث تم بنجاح
    const { data: verifyData, error: verifyError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'shipping_companies_enabled')
      .single();

    if (verifyError) {
      console.error('خطأ في التحقق من التحديث:', verifyError);
    } else {
      console.log('القيمة المحفوظة في قاعدة البيانات:', verifyData.value);
      console.log('هل القيم متطابقة؟', verifyData.value === enabledValue);
    }

    // تحديث الإعدادات الأخرى إذا تم تمريرها
    const additionalUpdates = [];
    
    if (default_shipping_cost !== undefined) {
      additionalUpdates.push({
        key: 'default_shipping_cost',
        value: default_shipping_cost.toString(),
        updated_at: new Date().toISOString()
      });
    }

    if (default_free_shipping_threshold !== undefined) {
      additionalUpdates.push({
        key: 'default_free_shipping_threshold',
        value: default_free_shipping_threshold.toString(),
        updated_at: new Date().toISOString()
      });
    }

    // تحديث الإعدادات الإضافية إذا وجدت
    if (additionalUpdates.length > 0) {
      const { error: additionalError } = await supabase
        .from('site_settings')
        .upsert(additionalUpdates, { onConflict: 'key' });

      if (additionalError) {
        console.error('خطأ في تحديث الإعدادات الإضافية:', additionalError);
      } else {
        console.log('تم تحديث الإعدادات الإضافية بنجاح');
      }
    }

    // إرسال إشعار تلقائي بعد تحديث الإعدادات
    try {
      const statusText = shipping_companies_enabled ? 'تم تفعيل' : 'تم إلغاء تفعيل';
      await supabase
        .from('notifications')
        .insert([
          {
            message: `${statusText} نظام شركات الشحن في المتجر`,
            type: 'settings',
          },
        ]);
      console.log('تم إرسال الإشعار بنجاح');
    } catch (notifyErr) {
      console.error('فشل في إرسال إشعار تحديث الإعدادات:', notifyErr);
    }

    const response = {
      success: true,
      message: shipping_companies_enabled 
        ? 'تم تفعيل نظام شركات الشحن بنجاح' 
        : 'تم إلغاء تفعيل نظام شركات الشحن بنجاح',
      data: {
        shipping_companies_enabled,
        default_shipping_cost: default_shipping_cost || 25,
        default_free_shipping_threshold: default_free_shipping_threshold || 500
      }
    };

    console.log('الاستجابة النهائية:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('خطأ في API تحديث إعدادات نظام شركات الشحن:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
} 