import { NextResponse } from 'next/server';
import { safeCreateClient } from '@/lib/auth';

// استرجاع المنتجات للوحة التحكم
export async function GET(request: Request) {
  try {
    const supabase = await safeCreateClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'فشل في الاتصال بقاعدة البيانات' },
        { status: 500 }
      );
    }
    
    // الحصول على معلمات الاستعلام (الصفحة، عدد العناصر، البحث، إلخ)
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    
    // بناء استعلام قاعدة البيانات
    const query = supabase.from('products').select('*, categories(name)');
    
    // إضافة البحث إذا كان موجودًا
    let filteredQuery = query;
    if (search) {
      filteredQuery = query.ilike('name', `%${search}%`) as any;
    }
    
    // تنفيذ الاستعلام مع الحد والإزاحة
    const { data: products, error } = await filteredQuery.limit(limit);
    
    if (error) {
      throw error;
    }
    
    // تحويل البيانات لإضافة اسم التصنيف
    const formattedProducts = products.map(product => ({
      ...product,
      category_name: product.categories?.name || 'غير مصنف'
    }));
    
    // الحصول على العدد الإجمالي للمنتجات (في الحالة الحقيقية ستحتاج لاستعلام منفصل للحصول على العدد)
    const count = products.length; // هذا مجرد تقريب، في الإنتاج ستحتاج لاستعلام منفصل
    
    return NextResponse.json({
      products: formattedProducts,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error: any) {
    console.error('خطأ في جلب المنتجات:', error);
    return NextResponse.json(
      { 
        error: 'فشل في جلب المنتجات', 
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

// إضافة منتج جديد
export async function POST(request: Request) {
  try {
    const supabase = await safeCreateClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'فشل في الاتصال بقاعدة البيانات' },
        { status: 500 }
      );
    }
    
    const data = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!data.name || !data.price) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }
    
    // إضافة المنتج إلى قاعدة البيانات
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        description: data.description || '',
        price: data.price,
        category_type: data.category_type,
        image: data.image,
        stock_quantity: data.stock_quantity || 0,
        is_active: data.is_active !== false,
        is_popular: data.is_popular || false,
        is_new: data.is_new || false,
        discount: data.discount || 0
      });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, message: 'تم إضافة المنتج بنجاح' });
  } catch (error: any) {
    console.error('خطأ في إضافة المنتج:', error);
    return NextResponse.json(
      { 
        error: 'فشل في إضافة المنتج', 
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
} 