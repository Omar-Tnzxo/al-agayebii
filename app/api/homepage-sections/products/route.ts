import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - جلب المنتجات المرتبطة بقسم معين
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get('section_id');

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('homepage_section_products')
      .select(`
        id,
        sort_order,
        products:product_id (
          id, name, description, price, original_price,
          images, rating, reviews_count, in_stock, badge
        )
      `)
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - إضافة منتج إلى قسم
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section_id, product_id, sort_order } = body;

    if (!section_id || !product_id) {
      return NextResponse.json(
        { success: false, error: 'Section ID and Product ID are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('homepage_section_products')
      .insert({
        section_id,
        product_id,
        sort_order: sort_order ?? 0
      })
      .select()
      .single();

    if (error) {
      // التحقق من خطأ التكرار
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Product already exists in this section' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - حذف منتج من قسم
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('homepage_section_products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Product removed from section successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - تحديث ترتيب منتج في قسم
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, sort_order } = body;

    if (!id || sort_order === undefined) {
      return NextResponse.json(
        { success: false, error: 'ID and sort_order are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('homepage_section_products')
      .update({ sort_order })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
