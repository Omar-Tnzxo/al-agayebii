import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface ProductData {
  name: string;
  description: string;
  price: number;
  cost_price?: number | null;
  category_type: string;
  stock_quantity: number;
  image?: string | null;
  images?: string[];
  colors?: Array<{
    name: string;
    hex?: string;
    hexCode?: string;
    stock: number;
    isAvailable?: boolean;
  }>;
  is_active: boolean;
  is_popular: boolean;
  is_featured: boolean;
  is_exclusive: boolean;
  is_new: boolean;
  discount_percentage: number;
  new_until?: string | null;
  sku?: string | null;
  slug?: string;
  rating?: number;
  reviews_count?: number;
}

// Helper function to create Supabase client
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET - جلب منتج محدد
export async function GET(
  request: Request,
  context: { params: { id?: string; slug?: string } }
) {
  try {
    const supabase = createSupabaseClient();
    // دعم الجلب بالـ id أو slug
    const { id, slug } = await context.params;
    let productQuery;
    if (id) {
      productQuery = supabase.from('products').select('*').eq('id', id).single();
    } else if (slug) {
      productQuery = supabase.from('products').select('*').eq('slug', slug).single();
    } else {
      return NextResponse.json(
        { success: false, message: 'يجب تمرير id أو slug' },
        { status: 400 }
      );
    }
    const { data: product, error: productError } = await productQuery;
    if (productError) {
      console.error('خطأ في جلب المنتج:', productError);
      return NextResponse.json(
        { success: false, message: 'فشل في جلب بيانات المنتج' },
        { status: 404 }
      );
    }
    // جلب صور المنتج
    const { data: images } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', product.id)
      .order('created_at');
    // جلب ألوان المنتج
    const { data: colors } = await supabase
      .from('product_colors')
      .select('id, color_name, color_code, stock_quantity')
      .eq('product_id', product.id);
    // تجميع البيانات
    const productData = {
      ...product,
      images: images || [],
      colors: colors || []
    };
    return NextResponse.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('خطأ عام في جلب المنتج:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// PUT - تحديث منتج
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();
    const { id: productId } = await params;
    const body = await request.json() as ProductData;

    console.log('📝 تحديث المنتج رقم:', productId);
    console.log('📋 البيانات الجديدة:', body);

    // استخراج بيانات المنتج الأساسية
    const {
      images,
      colors,
      ...productData
    } = body;

    // التحقق من uniqueness للـ sku وslug إذا تم تغييرهما
    if (productData.sku) {
      const { data: skuExists } = await supabase
        .from('products')
        .select('id')
        .eq('sku', productData.sku)
        .neq('id', productId)
        .maybeSingle();
      
      if (skuExists) {
        return NextResponse.json(
          { success: false, message: 'كود المنتج (SKU) مستخدم من قبل. اختر كود آخر.' },
          { status: 400 }
        );
      }
    }

    if (productData.slug) {
      const { data: slugExists } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productData.slug)
        .neq('id', productId)
        .maybeSingle();
      
      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'الرابط المخصص (slug) مستخدم من قبل. اختر رابط آخر.' },
          { status: 400 }
        );
      }
    }

    // تحديث بيانات المنتج الأساسية
    const { error: updateError } = await supabase
          .from('products')
      .update({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        cost_price: productData.cost_price !== undefined && productData.cost_price !== null && String(productData.cost_price) !== '' ? Number(productData.cost_price) : null,
        category_type: productData.category_type,
        stock_quantity: productData.stock_quantity,
        image: productData.image,
        is_active: productData.is_active,
        is_popular: productData.is_popular,
        is_featured: productData.is_featured,
        is_exclusive: productData.is_exclusive,
        is_new: productData.is_new,
        discount_percentage: productData.discount_percentage != null && productData.discount_percentage > 0 
          ? productData.discount_percentage 
          : null,
        sku: productData.sku || null,
        slug: productData.slug,
        rating: productData.rating || 0,
        reviews_count: productData.reviews_count || 0,
        updated_at: new Date().toISOString(),
        new_until: productData.new_until || null
      })
      .eq('id', productId);

    if (updateError) {
      console.error('خطأ في تحديث المنتج:', updateError);
      return NextResponse.json(
        { success: false, message: 'فشل في تحديث بيانات المنتج' },
        { status: 500 }
      );
    }

    // إشعار نفاد مخزون المنتج إذا أصبحت الكمية 0 أو أقل
    if (typeof productData.stock_quantity === 'number' && productData.stock_quantity <= 0) {
      try {
        await supabase
          .from('notifications')
          .insert([
            {
              message: `⚠️ المنتج "${productData.name}" نفد من المخزون!`,
              type: 'alert',
            },
          ]);
      } catch (notifyErr) {
        console.error('فشل في إرسال إشعار نفاد المخزون:', notifyErr);
      }
    }

    // تحديث صور المنتج إذا تم تمريرها
    if (images && Array.isArray(images)) {
      // حذف الصور القديمة
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      // إضافة الصور الجديدة
      if (images.length > 0) {
        const imageRecords = images.map((imageUrl, index) => ({
          product_id: productId,
          image_url: imageUrl,
          is_primary: index === 0
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('خطأ في حفظ الصور:', imagesError);
        } else {
          console.log('✅ تم حفظ الصور:', images.length);
        }
      }
    }

    // تحديث ألوان المنتج إذا تم تمريرها
    if (colors && Array.isArray(colors)) {
      // حذف الألوان القديمة
      await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', productId);

      // إضافة الألوان الجديدة
      if (colors.length > 0) {
        const colorRecords = colors.map(color => ({
          product_id: productId,
          color_name: color.name,
          color_code: color.hex || color.hexCode,
          is_available: color.isAvailable ?? true,
          stock_quantity: color.stock || 0
        }));

        const { error: colorsError } = await supabase
          .from('product_colors')
          .insert(colorRecords);

        if (colorsError) {
          console.error('خطأ في حفظ الألوان:', colorsError);
        } else {
          console.log('✅ تم حفظ الألوان:', colors.length);
        }
      }
    }

    console.log('✅ تم تحديث المنتج بنجاح:', productData.name);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح',
      data: { id: productId }
    });
    
  } catch (error) {
    console.error('خطأ عام في تحديث المنتج:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف منتج
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();
    const { id: productId } = await params;

    console.log('🗑️ حذف المنتج رقم:', productId);

    // حذف الصور المرتبطة أولاً
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    // حذف الألوان المرتبطة
    await supabase
      .from('product_colors')
      .delete()
      .eq('product_id', productId);
        
        // حذف المنتج
    const { error: deleteError } = await supabase
          .from('products')
          .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('خطأ في حذف المنتج:', deleteError);
      return NextResponse.json(
        { success: false, message: 'فشل في حذف المنتج' },
        { status: 500 }
      );
        }
        
        console.log('✅ تم حذف المنتج بنجاح');
        
        return NextResponse.json({ 
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ عام في حذف المنتج:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث حالة المنتج فقط
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();
    const { id: productId } = await params;
    const body = await request.json();

    // فقط تحديث is_active
    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'قيمة is_active مطلوبة ويجب أن تكون true أو false' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) {
      return NextResponse.json(
        { success: false, message: 'فشل في تحديث حالة المنتج', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'تم تحديث حالة المنتج بنجاح' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم', error: error.message },
      { status: 500 }
    );
  }
} 