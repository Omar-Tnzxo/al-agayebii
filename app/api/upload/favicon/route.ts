import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials missing');
  return createClient(url, key);
}

const supabase = getAdminClient();

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/x-icon', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, message: 'لم يتم تحديد ملف' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'نوع الملف غير مدعوم' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'حجم الملف كبير جداً' }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const ext = file.name.split('.').pop();
    const fileName = `favicon_${timestamp}_${randomId}.${ext}`;
    const filePath = `favicons/${fileName}`;

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('[upload/favicon] error:', uploadError);
      return NextResponse.json({ success: false, message: 'فشل في رفع الملف', error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      return NextResponse.json({ success: false, message: 'فشل في الحصول على رابط الملف' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { url: urlData.publicUrl, path: filePath } });
  } catch (err: any) {
    console.error('[upload/favicon] unknown error:', err);
    return NextResponse.json({ success: false, message: 'خطأ في الخادم', error: err.message }, { status: 500 });
  }
} 