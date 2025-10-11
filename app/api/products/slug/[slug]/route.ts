import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  const { slug } = params;

  // جلب المنتج من قاعدة البيانات باستخدام slug
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'المنتج غير موجود' },
      { status: 404 }
    );
  }

  // زيادة عداد المشاهدات
  const newViewCount = (data.view_count || 0) + 1;
  await supabase
    .from('products')
    .update({ view_count: newViewCount })
    .eq('id', data.id);

  // أعد القيمة الجديدة في الاستجابة
  return NextResponse.json({ success: true, data: { ...data, view_count: newViewCount } });
} 