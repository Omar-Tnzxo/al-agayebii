import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath, revalidateTag } from 'next/cache';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const supabase = getAdminClient();

// GET جميع الإعدادات
export async function GET() {
  if (!supabase) {
    console.error('[API Settings] Supabase not configured');
    return NextResponse.json({
      success: false,
      error: 'Supabase not configured',
      data: {}
    }, { status: 500 });
  }

  try {
    const { data, error } = await supabase.from('site_settings').select('key,value');

    if (error) {
      console.error('[API Settings] Database error:', error);
      // إرجاع إعدادات افتراضية في حالة الخطأ
      return NextResponse.json({
        success: true,
        data: {
          siteName: 'متجر العقائبي',
          siteDescription: 'متجر إلكتروني',
          shipping_cost: '50',
          free_shipping_threshold: '500'
        }
      });
    }

    const settings: Record<string, string> = {};
    if (data && data.length > 0) {
      data.forEach((row) => {
        settings[row.key] = row.value;
      });
    } else {
      // إذا لم توجد بيانات، أرجع إعدادات افتراضية
      console.warn('[API Settings] No settings found, returning defaults');
      return NextResponse.json({
        success: true,
        data: {
          siteName: 'متجر العقائبي',
          siteDescription: 'متجر إلكتروني',
          shipping_cost: '50',
          free_shipping_threshold: '500'
        }
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('[API Settings] Unexpected error:', error);
    return NextResponse.json({
      success: true,
      data: {
        siteName: 'متجر العقائبي',
        siteDescription: 'متجر إلكتروني',
        shipping_cost: '50',
        free_shipping_threshold: '500'
      }
    });
  }
}

// PATCH تحديث مجموعة مفاتيح
export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const body = await request.json();
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Payload must be an object' }, { status: 400 });
  }
  const updates = Object.entries(body).map(([key, value]) => ({ key, value: String(value), updated_at: new Date().toISOString() }));
  const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // إعادة تفعيل التخزين المؤقت لمسار الجذر وأي علامات مرتبطة بالإعدادات
  try {
    revalidatePath('/');
    revalidateTag('site-settings');
  } catch (err) {
    console.error('[settings PATCH] revalidate error:', err);
  }

  // إضافة header لمسح كاش المتصفح
  const response = NextResponse.json({ success: true, clearCache: true });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
} 