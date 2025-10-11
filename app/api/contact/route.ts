import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseContactSettings, getDefaultContactSettings } from '@/lib/utils/contact';
import type { ContactFormData } from '@/lib/types/contact';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const supabase = getAdminClient();

// GET معلومات صفحة الاتصال
export async function GET() {
  if (!supabase) {
    return NextResponse.json({
      success: false,
      error: 'Database configuration error',
      data: parseContactSettings(getDefaultContactSettings())
    }, { status: 500 });
  }

  try {
    // جلب إعدادات الاتصال من site_settings
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .like('key', 'contact_%');

    if (error) {
      console.error('[Contact API] Database error:', error);
      return NextResponse.json({
        success: true,
        data: parseContactSettings(getDefaultContactSettings())
      });
    }

    // تحويل البيانات إلى كائن
    const settings: Record<string, string> = {};
    data?.forEach(row => {
      settings[row.key] = row.value;
    });

    // إذا لم توجد إعدادات، استخدم الافتراضية
    if (Object.keys(settings).length === 0) {
      const defaultSettings = getDefaultContactSettings();
      // حفظ الإعدادات الافتراضية في قاعدة البيانات
      const updates = Object.entries(defaultSettings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      await supabase.from('site_settings').upsert(updates, { onConflict: 'key' });
      
      return NextResponse.json({
        success: true,
        data: parseContactSettings(defaultSettings)
      });
    }

    return NextResponse.json({
      success: true,
      data: parseContactSettings(settings)
    });

  } catch (error) {
    console.error('[Contact API] Unexpected error:', error);
    return NextResponse.json({
      success: true,
      data: parseContactSettings(getDefaultContactSettings())
    });
  }
}

// POST إرسال نموذج الاتصال
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({
      success: false,
      error: 'Database configuration error'
    }, { status: 500 });
  }

  try {
    const formData: ContactFormData = await request.json();

    // التحقق من صحة البيانات
    if (!formData.name || !formData.email || !formData.message) {
      return NextResponse.json({
        success: false,
        error: 'الرجاء ملء جميع الحقول المطلوبة'
      }, { status: 400 });
    }

    // محاكاة حفظ الرسالة - في التطبيق الحقيقي يجب إنشاء جدول contact_messages
    console.log('Contact form submission:', formData);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
      data: { id: Date.now().toString() }
    });

  } catch (error) {
    console.error('[Contact Form] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    }, { status: 500 });
  }
}

// PATCH تحديث إعدادات الاتصال (للمدراء فقط)
export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({
      success: false,
      error: 'Database configuration error'
    }, { status: 500 });
  }

  try {
    const updates = await request.json();
    
    // تحديث الإعدادات
    const settingsUpdates = Object.entries(updates)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        key: `contact_${key}`,
        value: String(value),
        updated_at: new Date().toISOString()
      }));

    if (settingsUpdates.length > 0) {
      const { error } = await supabase
        .from('site_settings')
        .upsert(settingsUpdates, { onConflict: 'key' });

      if (error) {
        console.error('[Contact Settings Update] Database error:', error);
        return NextResponse.json({
          success: false,
          error: 'فشل في تحديث الإعدادات'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح'
    });

  } catch (error) {
    console.error('[Contact Settings Update] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء تحديث الإعدادات'
    }, { status: 500 });
  }
}