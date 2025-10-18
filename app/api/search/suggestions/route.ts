import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // البحث في أسماء المنتجات فقط للاقتراحات السريعة
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, image, price, discount_percentage')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .order('view_count', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Suggestions error:', error);
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      hasDiscount: product.discount_percentage > 0,
    }));

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
