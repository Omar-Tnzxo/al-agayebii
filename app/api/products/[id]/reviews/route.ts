import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// جلب التقييمات لمنتج معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

// إضافة تقييم جديد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
  }
  const body = await request.json();
  const { reviewer_name, rating, comment } = body;
  if (!reviewer_name || !rating) {
    return NextResponse.json({ success: false, error: 'الاسم والتقييم مطلوبان' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      reviewer_name,
      rating,
      comment: comment || '',
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // إرسال إشعار تلقائي بعد نجاح إضافة التقييم
  try {
    await supabase
      .from('notifications')
      .insert([
        {
          message: `تم إضافة تقييم جديد من ${reviewer_name} على منتج رقم ${productId}`,
          type: 'review',
        },
      ]);
  } catch (notifyErr) {
    console.error('فشل في إرسال إشعار التقييم الجديد:', notifyErr);
  }

  return NextResponse.json({ success: true, data });
} 