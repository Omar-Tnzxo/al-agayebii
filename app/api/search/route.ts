import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'relevance';
    const limit = parseInt(searchParams.get('limit') || '20');

    // التحقق من وجود query
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        products: [],
        total: 0,
        message: 'الرجاء إدخال كلمة بحث'
      });
    }

    // بناء الاستعلام
    let queryBuilder = supabase
      .from('products')
      .select('id, name, description, price, discount_percentage, slug, image, rating, reviews_count, stock_quantity, category_type, view_count', { count: 'exact' })
      .eq('is_active', true);

    // البحث في الاسم والوصف
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    // فلترة حسب الفئة
    if (category && category !== 'all') {
      queryBuilder = queryBuilder.eq('category_type', category);
    }

    // فلترة حسب السعر
    if (minPrice) {
      queryBuilder = queryBuilder.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      queryBuilder = queryBuilder.lte('price', parseFloat(maxPrice));
    }

    // الترتيب
    switch (sort) {
      case 'price_asc':
        queryBuilder = queryBuilder.order('price', { ascending: true });
        break;
      case 'price_desc':
        queryBuilder = queryBuilder.order('price', { ascending: false });
        break;
      case 'rating':
        queryBuilder = queryBuilder.order('rating', { ascending: false, nullsLast: true });
        break;
      case 'newest':
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
        break;
      case 'popular':
        queryBuilder = queryBuilder.order('view_count', { ascending: false, nullsLast: true });
        break;
      default:
        // relevance - ترتيب افتراضي حسب المشاهدات والتقييم
        queryBuilder = queryBuilder.order('view_count', { ascending: false, nullsLast: true });
    }

    // تحديد عدد النتائج
    queryBuilder = queryBuilder.limit(limit);

    const { data: products, error, count } = await queryBuilder;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'حدث خطأ أثناء البحث' },
        { status: 500 }
      );
    }

    // تنسيق النتائج
    const formattedProducts = (products || []).map((product: any) => {
      const originalPrice = product.discount_percentage > 0 
        ? product.price / (1 - product.discount_percentage / 100)
        : undefined;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice,
        discount: product.discount_percentage,
        slug: product.slug,
        image: product.image,
        rating: product.rating || 0,
        reviewCount: product.reviews_count || 0,
        inStock: product.stock_quantity > 0,
        categoryType: product.category_type,
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total: count || 0,
      query,
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
