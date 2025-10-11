// API endpoint أو سكريبت لحذف الإشعارات الأقدم من 30 يومًا
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// يمكنك استدعاء هذا endpoint يدويًا أو من مهمة مجدولة (cron)
export async function POST(req: NextRequest) {
  // حساب تاريخ 30 يومًا مضت
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', cutoffDate)
    .select('id');
  if (error) {
    return NextResponse.json({ error: 'فشل في حذف الإشعارات القديمة', details: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, deleted: count });
} 