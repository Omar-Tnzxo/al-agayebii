import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/notifications?page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // جلب الإشعارات الأحدث أولاً
    const { data: notifications, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: 'فشل في جلب الإشعارات', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ notifications, total: count });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في جلب الإشعارات', details: error.message }, { status: 500 });
  }
}

// POST /api/notifications
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, type } = body;
    if (!message || !type) {
      return NextResponse.json({ error: 'الرسالة والنوع مطلوبان' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ message, type }])
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: 'فشل في إضافة الإشعار', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ notification: data });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في إضافة الإشعار', details: error.message }, { status: 500 });
  }
} 