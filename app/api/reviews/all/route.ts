import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// جلب جميع التقييمات مع معلومات المنتج
export async function GET(request: NextRequest) {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        products:product_id (
          id,
          name,
          image
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // إعادة هيكلة البيانات
    const formattedReviews = reviews?.map(review => ({
      ...review,
      product: Array.isArray(review.products) ? review.products[0] : review.products
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedReviews
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
