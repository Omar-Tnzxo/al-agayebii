import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - جلب الإحصائيات وجميع التقييمات
export async function GET() {
  try {
    // 1. جلب إعداد reviews_enabled
    const { data: setting, error: settingError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'reviews_enabled')
      .single();

    const reviewsEnabled = setting?.value === 'true';

    // 2. جلب جميع التقييمات مع معلومات المنتج
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        products (name, slug)
      `)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // 3. حساب الإحصائيات
    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0
      ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // 4. تنسيق البيانات
    const formattedReviews = reviews?.map(review => ({
      id: review.id,
      product_id: review.product_id,
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      product: review.products ? {
        name: review.products.name,
        slug: review.products.slug
      } : null
    })) || [];

    return NextResponse.json({
      success: true,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewsEnabled
      },
      reviews: formattedReviews
    });

  } catch (error: any) {
    console.error('Error in reviews-settings API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - تفعيل/تعطيل نظام التقييمات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, enabled } = body;

    if (action !== 'toggle') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // تحديث أو إضافة الإعداد
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'reviews_enabled',
        value: enabled ? 'true' : 'false'
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('Error updating reviews_enabled:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام التقييمات بنجاح`,
      enabled
    });

  } catch (error: any) {
    console.error('Error in POST reviews-settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - حذف تقييم
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف التقييم بنجاح'
    });

  } catch (error: any) {
    console.error('Error in DELETE reviews-settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
