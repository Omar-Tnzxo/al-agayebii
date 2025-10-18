// سكريبت اختبار API التقييمات
// قم بتشغيله باستخدام: node test-reviews-api.js

const { createClient } = require('@supabase/supabase-js');

// استبدل هذه القيم من ملف .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReviewsAPI() {
  console.log('=== اختبار نظام التقييمات ===\n');

  // 1. فحص جدول reviews
  console.log('1. فحص جدول التقييمات...');
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .limit(5);

  if (reviewsError) {
    console.error('❌ خطأ في جلب التقييمات:', reviewsError.message);
  } else {
    console.log(`✅ عدد التقييمات: ${reviews.length}`);
    if (reviews.length > 0) {
      console.log('   أول تقييم:', JSON.stringify(reviews[0], null, 2));
    } else {
      console.log('   ⚠️  لا توجد تقييمات في قاعدة البيانات');
    }
  }

  // 2. فحص إعداد reviews_enabled
  console.log('\n2. فحص إعداد reviews_enabled...');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'reviews_enabled')
    .single();

  if (settingsError) {
    console.error('❌ خطأ في جلب الإعدادات:', settingsError.message);
    console.log('   ℹ️  قد يكون المفتاح غير موجود - سيتم تفعيل التقييمات افتراضياً');
  } else {
    console.log(`✅ reviews_enabled = ${settings.value}`);
    if (settings.value !== 'true') {
      console.log('   ⚠️  التقييمات معطلة! يجب تفعيلها من الإعدادات');
    }
  }

  // 3. فحص جدول المنتجات
  console.log('\n3. فحص جدول المنتجات...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug')
    .limit(3);

  if (productsError) {
    console.error('❌ خطأ في جلب المنتجات:', productsError.message);
  } else {
    console.log(`✅ عدد المنتجات: ${products.length}`);
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`   أول منتج: ${firstProduct.name} (ID: ${firstProduct.id})`);
      
      // فحص تقييمات هذا المنتج
      const { data: productReviews, error: productReviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', firstProduct.id);

      if (!productReviewsError) {
        console.log(`   عدد التقييمات لهذا المنتج: ${productReviews.length}`);
      }
    }
  }

  // 4. إضافة تقييم تجريبي
  console.log('\n4. محاولة إضافة تقييم تجريبي...');
  if (products && products.length > 0) {
    const testProductId = products[0].id;
    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert({
        product_id: testProductId,
        reviewer_name: 'مختبر النظام',
        rating: 5,
        comment: 'هذا تقييم تجريبي للاختبار - يمكن حذفه'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ خطأ في إضافة تقييم:', insertError.message);
    } else {
      console.log('✅ تم إضافة تقييم تجريبي بنجاح!');
      console.log('   ID:', newReview.id);
      console.log('   ℹ️  يمكنك الآن اختبار صفحة المنتج');
    }
  }

  console.log('\n=== انتهى الاختبار ===');
  console.log('\nالخطوات التالية:');
  console.log('1. إذا كانت التقييمات معطلة، فعّلها من لوحة التحكم');
  console.log('2. إذا لم يكن هناك تقييمات، أضف تقييم تجريبي');
  console.log('3. تأكد من أن API endpoint يعمل بشكل صحيح');
  console.log('4. افتح صفحة منتج وتحقق من ظهور التقييمات');
}

testReviewsAPI().catch(console.error);
