import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// API لاختبار نظام التقييمات
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  try {
    // 1. فحص جدول reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(10);

    results.checks.push({
      name: 'جدول التقييمات',
      status: reviewsError ? 'error' : 'success',
      message: reviewsError ? reviewsError.message : `تم العثور على ${reviews?.length || 0} تقييمات`,
      data: reviews || []
    });

    // 2. فحص إعداد reviews_enabled
    const { data: reviewsSetting, error: settingsError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'reviews_enabled')
      .single();

    results.checks.push({
      name: 'إعداد التقييمات (reviews_enabled)',
      status: settingsError ? 'warning' : 'success',
      message: settingsError 
        ? 'المفتاح غير موجود - سيتم تفعيل التقييمات افتراضياً' 
        : `القيمة: ${reviewsSetting.value}`,
      enabled: reviewsSetting?.value === 'true',
      data: reviewsSetting
    });

    // 3. فحص المنتجات
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug')
      .limit(5);

    results.checks.push({
      name: 'جدول المنتجات',
      status: productsError ? 'error' : 'success',
      message: productsError ? productsError.message : `تم العثور على ${products?.length || 0} منتجات`,
      data: products || []
    });

    // 4. فحص تقييمات كل منتج
    if (products && products.length > 0) {
      const productReviewsChecks = [];
      for (const product of products) {
        const { data: productReviews, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id);

        productReviewsChecks.push({
          product_id: product.id,
          product_name: product.name,
          product_slug: product.slug,
          reviews_count: productReviews?.length || 0,
          reviews: productReviews || []
        });
      }

      results.checks.push({
        name: 'تقييمات المنتجات',
        status: 'success',
        message: 'تفاصيل التقييمات لكل منتج',
        data: productReviewsChecks
      });
    }

    // 5. التوصيات
    const recommendations = [];
    
    if (reviewsSetting?.value !== 'true') {
      recommendations.push({
        type: 'warning',
        message: 'يجب تفعيل التقييمات من الإعدادات (reviews_enabled = true)',
        action: 'قم بتحديث site_settings في قاعدة البيانات'
      });
    }

    if (!reviews || reviews.length === 0) {
      recommendations.push({
        type: 'info',
        message: 'لا توجد تقييمات في قاعدة البيانات',
        action: 'أضف تقييم تجريبي لاختبار النظام'
      });
    }

    results.recommendations = recommendations;
    results.summary = {
      total_reviews: reviews?.length || 0,
      total_products: products?.length || 0,
      reviews_enabled: reviewsSetting?.value === 'true',
      status: reviewsError || productsError ? 'has_errors' : 'ok'
    };

  } catch (error: any) {
    results.error = {
      message: error.message,
      stack: error.stack
    };
  }

  return NextResponse.json(results, { status: 200 });
}
