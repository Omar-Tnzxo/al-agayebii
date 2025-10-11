import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إنشاء عميل Supabase بصلاحيات الإدارة
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب ألوان منتج معين
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const availableOnly = searchParams.get('available_only') === 'true';

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'معرف المنتج مطلوب'
      }, { status: 400 });
    }

    // بناء الاستعلام
    let query = supabaseAdmin
      .from('product_colors')
      .select('*')
      .eq('product_id', productId);

    // تصفية الألوان المتاحة فقط إذا طُلب ذلك
    if (availableOnly) {
      query = query.eq('is_available', true);
    }

    const { data: colors, error } = await query.order('color_name');

    if (error) {
      console.error('خطأ في جلب ألوان المنتج:', error);
      return NextResponse.json({
        success: false,
        error: 'خطأ في جلب ألوان المنتج'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: colors || []
    });

  } catch (error: any) {
    console.error('خطأ في جلب ألوان المنتج:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء جلب ألوان المنتج'
    }, { status: 500 });
  }
}

// POST - إضافة ألوان جديدة لمنتج
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, colors } = body;

    if (!product_id || !colors || !Array.isArray(colors)) {
      return NextResponse.json({
        success: false,
        error: 'معرف المنتج وقائمة الألوان مطلوبة'
      }, { status: 400 });
    }

    // التحقق من صحة بيانات الألوان
    for (const color of colors) {
      if (!color.color_name || !color.color_code) {
        return NextResponse.json({
          success: false,
          error: 'اسم اللون وكود اللون مطلوبان'
        }, { status: 400 });
      }

      // التحقق من صحة كود اللون (HEX)
      if (!/^#[0-9A-Fa-f]{6}$/.test(color.color_code)) {
        return NextResponse.json({
          success: false,
          error: `كود اللون ${color.color_code} غير صحيح. يجب أن يكون بصيغة HEX مثل #FF0000`
        }, { status: 400 });
      }
    }

    // إعداد بيانات الألوان للإدراج
    const colorData = colors.map((color: any) => ({
      product_id,
      color_name: color.color_name.trim(),
      color_code: color.color_code.toUpperCase(),
      is_available: color.is_available !== undefined ? color.is_available : true,
      stock_quantity: color.stock_quantity || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // حذف الألوان القديمة أولاً (إذا كان مطلوباً)
    if (body.replace_existing) {
      await supabaseAdmin
        .from('product_colors')
        .delete()
        .eq('product_id', product_id);
    }

    // إدراج الألوان الجديدة
    const { data: insertedColors, error } = await supabaseAdmin
      .from('product_colors')
      .insert(colorData)
      .select();

    if (error) {
      console.error('خطأ في إدراج ألوان المنتج:', error);
      
      // معالجة خطأ التكرار
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          error: 'يوجد لون بنفس الاسم مسبقاً لهذا المنتج'
        }, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'خطأ في حفظ ألوان المنتج'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: insertedColors,
      message: `تم حفظ ${colorData.length} لون بنجاح`
    });

  } catch (error: any) {
    console.error('خطأ في إضافة ألوان المنتج:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء إضافة ألوان المنتج'
    }, { status: 500 });
  }
}

// PUT - تحديث لون معين أو مجموعة ألوان
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { color_id, product_id, updates } = body;

    if (!color_id && !product_id) {
      return NextResponse.json({
        success: false,
        error: 'معرف اللون أو معرف المنتج مطلوب'
      }, { status: 400 });
    }

    let result;

    if (color_id) {
      // تحديث لون معين
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // التحقق من صحة كود اللون إذا تم تحديثه
      if (updates.color_code && !/^#[0-9A-Fa-f]{6}$/.test(updates.color_code)) {
        return NextResponse.json({
          success: false,
          error: 'كود اللون غير صحيح. يجب أن يكون بصيغة HEX مثل #FF0000'
        }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('product_colors')
        .update(updateData)
        .eq('id', color_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      result = data;
    } else {
      // تحديث مجموعة من الألوان (لمنتج معين)
      const { colors } = updates;
      if (colors && Array.isArray(colors)) {
        for (const color of colors) {
          await supabaseAdmin
            .from('product_colors')
            .update({ 
              color_name: color.color_name,
              color_code: color.color_code,
              is_available: color.is_available,
              stock_quantity: color.stock_quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', color.id);
        }
      }

      // جلب الألوان المحدثة
      const { data, error } = await supabaseAdmin
        .from('product_colors')
        .select('*')
        .eq('product_id', product_id)
        .order('color_name');

      if (error) {
        throw error;
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'تم تحديث الألوان بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في تحديث ألوان المنتج:', error);
    
    // معالجة خطأ التكرار
    if (error.code === '23505') {
      return NextResponse.json({
        success: false,
        error: 'يوجد لون بنفس الاسم مسبقاً لهذا المنتج'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء تحديث ألوان المنتج'
    }, { status: 500 });
  }
}

// DELETE - حذف لون معين
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const colorId = searchParams.get('color_id');
    const productId = searchParams.get('product_id');

    if (!colorId) {
      return NextResponse.json({
        success: false,
        error: 'معرف اللون مطلوب'
      }, { status: 400 });
    }

    // حذف اللون
    const { error } = await supabaseAdmin
      .from('product_colors')
      .delete()
      .eq('id', colorId);

    if (error) {
      console.error('خطأ في حذف لون المنتج:', error);
      return NextResponse.json({
        success: false,
        error: 'خطأ في حذف اللون'
      }, { status: 500 });
    }

    // إرجاع الألوان المتبقية إذا تم تمرير معرف المنتج
    let remainingColors = null;
    if (productId) {
      const { data } = await supabaseAdmin
        .from('product_colors')
        .select('*')
        .eq('product_id', productId)
        .order('color_name');
      
      remainingColors = data;
    }

    return NextResponse.json({
      success: true,
      data: remainingColors,
      message: 'تم حذف اللون بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في حذف لون المنتج:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء حذف اللون'
    }, { status: 500 });
  }
} 