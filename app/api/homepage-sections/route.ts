import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - جلب جميع أقسام الصفحة الرئيسية
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    const sectionType = searchParams.get('type');
    const id = searchParams.get('id');

    let query = supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (id) {
      query = query.eq('id', id);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (sectionType) {
      query = query.eq('section_type', sectionType);
    }

    const { data, error } = await query;

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

// POST - إضافة قسم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section_type, title, subtitle, is_active, sort_order, settings } = body;

    if (!section_type || !title) {
      return NextResponse.json(
        { success: false, error: 'Section type and title are required' },
        { status: 400 }
      );
    }

    // التحقق من نوع القسم
    const validTypes = ['categories', 'products'];
    if (!validTypes.includes(section_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid section type' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('homepage_sections')
      .insert({
        section_type,
        title,
        subtitle,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
        settings: settings || {
          product_source: 'manual',
          category_type: null,
          product_count: 8,
          layout: 'grid',
          columns: 4,
          show_view_all: true
        }
      })
      .select()
      .single();

    if (error) {
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

// PUT - تحديث قسم
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, section_type, title, subtitle, is_active, sort_order, settings } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (section_type !== undefined) updateData.section_type = section_type;
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (settings !== undefined) updateData.settings = settings;

    const { data, error } = await supabase
      .from('homepage_sections')
      .update(updateData)
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

// DELETE - حذف قسم
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
      .from('homepage_sections')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Section deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
