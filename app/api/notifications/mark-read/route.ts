import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/notifications/mark-read
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, all } = body;
    if (all) {
      // تعليم كل الإشعارات كمقروءة
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) {
        return NextResponse.json({ error: 'فشل في تحديث كل الإشعارات', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }
    if (!id) {
      return NextResponse.json({ error: 'معرف الإشعار (id) مطلوب' }, { status: 400 });
    }
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'فشل في تحديث الإشعار', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في تحديث الإشعار', details: error.message }, { status: 500 });
  }
} 