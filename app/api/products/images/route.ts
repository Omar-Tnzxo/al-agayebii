import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إنشاء عميل Supabase بصلاحيات الإدارة
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - جلب صور منتج معين
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'معرف المنتج مطلوب'
      }, { status: 400 });
    }

    // جلب صور المنتج من قاعدة البيانات
    const { data: images, error } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order')
      .order('created_at');

    if (error) {
      console.error('خطأ في جلب صور المنتج:', error);
      return NextResponse.json({
        success: false,
        error: 'خطأ في جلب صور المنتج'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: images || []
    });

  } catch (error: any) {
    console.error('خطأ في جلب صور المنتج:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء جلب صور المنتج'
    }, { status: 500 });
  }
}

// POST - إضافة صور جديدة لمنتج
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, images } = body;

    if (!product_id || !images || !Array.isArray(images)) {
      return NextResponse.json({
        success: false,
        error: 'معرف المنتج وقائمة الصور مطلوبة'
      }, { status: 400 });
    }

    // إعداد بيانات الصور للإدراج
    const imageData = images.map((image: any, index: number) => ({
      product_id,
      image_url: image.url || image.image_url,
      alt_text: image.alt_text || `صورة المنتج ${index + 1}`,
      display_order: image.display_order || index,
      is_primary: index === 0, // الصورة الأولى تكون رئيسية
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // حذف الصور القديمة أولاً (إذا كان مطلوباً)
    if (body.replace_existing) {
      await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', product_id);
    }

    // إدراج الصور الجديدة
    const { data: insertedImages, error } = await supabaseAdmin
      .from('product_images')
      .insert(imageData)
      .select();

    if (error) {
      console.error('خطأ في إدراج صور المنتج:', error);
      return NextResponse.json({
        success: false,
        error: 'خطأ في حفظ صور المنتج'
      }, { status: 500 });
    }

    // تحديث الصورة الرئيسية في جدول المنتجات
    if (imageData.length > 0) {
      await supabaseAdmin
        .from('products')
        .update({ image: imageData[0].image_url })
        .eq('id', product_id);
    }

    return NextResponse.json({
      success: true,
      data: insertedImages,
      message: `تم حفظ ${imageData.length} صورة بنجاح`
    });

  } catch (error: any) {
    console.error('خطأ في إضافة صور المنتج:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء إضافة صور المنتج'
    }, { status: 500 });
  }
}

// PUT - تحديث ترتيب الصور أو تعيين الصورة الرئيسية
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { image_id, product_id, updates } = body;

    if (!image_id && !product_id) {
      return NextResponse.json({
        success: false,
        error: 'معرف الصورة أو معرف المنتج مطلوب'
      }, { status: 400 });
    }

    let result;

    if (image_id) {
      // تحديث صورة معينة
      const { data, error } = await supabaseAdmin
        .from('product_images')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', image_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      result = data;

      // إذا تم تعيين صورة جديدة كرئيسية، ألغي الرئيسية من الصور الأخرى
      if (updates.is_primary) {
        await supabaseAdmin
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', data.product_id)
          .neq('id', image_id);

        // تحديث الصورة الرئيسية في جدول المنتجات
        await supabaseAdmin
          .from('products')
          .update({ image: data.image_url })
          .eq('id', data.product_id);
      }
    } else {
      // تحديث جميع صور المنتج (مثل إعادة ترتيب)
      const { images } = updates;
      if (images && Array.isArray(images)) {
        for (const image of images) {
          await supabaseAdmin
            .from('product_images')
            .update({ 
              display_order: image.display_order,
              is_primary: image.is_primary,
              updated_at: new Date().toISOString()
            })
            .eq('id', image.id);
        }
      }

      // جلب الصور المحدثة
      const { data, error } = await supabaseAdmin
        .from('product_images')
        .select('*')
        .eq('product_id', product_id)
        .order('display_order');

      if (error) {
        throw error;
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'تم تحديث الصور بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في تحديث صور المنتج:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء تحديث صور المنتج'
    }, { status: 500 });
  }
}

// DELETE - حذف صورة معينة
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('image_id');
    const productId = searchParams.get('product_id');

    if (!imageId) {
      return NextResponse.json({
        success: false,
        error: 'معرف الصورة مطلوب'
      }, { status: 400 });
    }

    // حذف الصورة
    const { error } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('خطأ في حذف صورة المنتج:', error);
      return NextResponse.json({
        success: false,
        error: 'خطأ في حذف الصورة'
      }, { status: 500 });
    }

    // إذا تم حذف الصورة الرئيسية، اجعل أول صورة أخرى رئيسية
    if (productId) {
      const { data: remainingImages } = await supabaseAdmin
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order')
        .limit(1);

      if (remainingImages && remainingImages.length > 0) {
        await supabaseAdmin
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', remainingImages[0].id);

        await supabaseAdmin
          .from('products')
          .update({ image: remainingImages[0].image_url })
          .eq('id', productId);
      } else {
        // إذا لم تعد هناك صور، استخدم الصورة الافتراضية
        await supabaseAdmin
          .from('products')
          .update({ image: '/images/product-default.png' })
          .eq('id', productId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الصورة بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في حذف صورة المنتج:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء حذف الصورة'
    }, { status: 500 });
  }
} 