import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// إضافة وظيفة مساعدة للتأخير
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// الدالة التي تتعامل مع طلبات GET لجلب قائمة العروض النشطة
export async function GET(request: Request) {
  try {
    console.log('بدء استعلام العروض من API');

    // إضافة تأخير اصطناعي لمعرفة إذا كانت المشكلة في توقيت الاستجابة
    await delay(500);

    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // طباعة معلومات التشخيص
    console.log('تهيئة الاتصال بـ Supabase، URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...');

    // إعداد استعلام قاعدة البيانات
    let query = supabase
      .from('promotions')
      .select('*')
      .order('priority', { ascending: true });

    // تصفية النتائج لتشمل فقط العروض النشطة إذا تم التحديد
    if (onlyActive) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('start_date', now)
        .gt('end_date', now);
    }

    // تنفيذ الاستعلام
    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('خطأ في استرجاع بيانات العروض:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // طباعة معلومات نجاح الاستعلام
    console.log('تم استرداد العروض بنجاح، عدد النتائج:', data?.length || 0);

    // في حالة عدم وجود بيانات، نقوم بإرجاع مصفوفة فارغة بدلاً من خطأ
    return NextResponse.json({ promotions: data || [] });
  } catch (error: any) {
    console.error('خطأ غير متوقع في استرجاع العروض:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// الدالة التي تتعامل مع طلبات POST لإنشاء عرض جديد
export async function POST(request: Request) {
  try {
    const promotion = await request.json();

    // التحقق من وجود البيانات المطلوبة وطولها
    if (!promotion.title) {
      return NextResponse.json({ error: 'عنوان العرض مطلوب' }, { status: 400 });
    }

    if (promotion.title.length > 255) {
      return NextResponse.json({ error: 'عنوان العرض يجب ألا يتجاوز 255 حرف' }, { status: 400 });
    }

    if (promotion.url && promotion.url.length > 255) {
      return NextResponse.json({ error: 'رابط العرض يجب ألا يتجاوز 255 حرف' }, { status: 400 });
    }

    // إدراج العرض الجديد
    const { data, error } = await supabase
      .from('promotions')
      .insert([{
        title: promotion.title,
        description: promotion.description,
        image_url: promotion.image_url,
        url: promotion.url,
        start_date: promotion.start_date,
        end_date: promotion.end_date,
        is_active: promotion.is_active ?? true,
        priority: promotion.priority ?? 0
      }])
      .select()
      .single();

    if (error) {
      console.error('خطأ في إنشاء العرض:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promotion: data }, { status: 201 });
  } catch (error: any) {
    console.error('خطأ غير متوقع في إنشاء العرض:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}