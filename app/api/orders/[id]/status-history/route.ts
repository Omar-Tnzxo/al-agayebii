import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إنشاء عميل Supabase مباشرة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 طلب جلب تاريخ حالات الطلب: ${id}`);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'قاعدة البيانات غير متوفرة' },
        { status: 500 }
      );
    }

    // جلب تاريخ الحالات مرتب بالتاريخ (الأحدث أولاً)
    const { data: statusHistory, error } = await supabaseAdmin
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ خطأ في جلب تاريخ الحالات:', error);
      return NextResponse.json(
        { error: 'فشل في جلب تاريخ الحالات', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ تم جلب ${statusHistory?.length || 0} سجل من تاريخ الحالات`);

    return NextResponse.json({
      success: true,
      data: statusHistory || []
    });

  } catch (error: any) {
    console.error('💥 خطأ عام في جلب تاريخ الحالات:', error);
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم', details: error.message },
      { status: 500 }
    );
  }
}
