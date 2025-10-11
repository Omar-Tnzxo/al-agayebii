import { NextRequest, NextResponse } from 'next/server';
import { BaseApiHandler } from '@/lib/api/base-handler';
import { supabase } from '@/lib/supabase';
import { apiRateLimiter, rateLimitMiddleware } from '@/lib/security/rate-limiter';
import { setCache, getCache, CACHE_KEYS } from '@/lib/cache/cache-manager';

class ProductsApiHandler extends BaseApiHandler {
  async handleProductsGet(request: NextRequest) {
    return this.handleRequest(async () => {
      let params: any = this.getQueryParams(request);
      
      // دعم color_id في الباراميترات
      if (request.nextUrl && request.nextUrl.searchParams) {
        params.color_id = request.nextUrl.searchParams.get('color_id') || '';
      }
      
      // فحص Cache أولاً
      const cacheKey = `products:${JSON.stringify(params)}`;
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
        this.logOperation('GET Products (from cache)', { params });
        return cachedData;
      }

      this.logOperation('GET Products', { params });

      let query = supabase
        .from('products')
        .select('*');

      // تطبيق الفلاتر
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      if (params.category) {
        query = query.eq('category_type', params.category);
      }

      if (params.featured) {
        query = query.eq('is_featured', true);
      }

      if (params.popular) {
        query = query.eq('is_popular', true);
      }

      if (params.exclusive) {
        query = query.eq('is_exclusive', true);
      }

      // فحص المنتجات الجديدة
      const isNew = request.url.includes('new=true');
      if (isNew) {
        query = query.eq('is_new', true);
      }

      // فلترة بناءً على الكمية المتاحة
      const inStock = request.url.includes('in_stock=true');
      if (inStock) {
        query = query.gt('stock_quantity', 0);
      }


      // فلترة بناءً على نطاق السعر
      if (params.minPrice && params.minPrice > 0) {
        query = query.gte('price', params.minPrice);
      }

      if (params.maxPrice && params.maxPrice > 0) {
        query = query.lte('price', params.maxPrice);
      }

      // فلترة حسب اللون
      if (params.color_id) {
        query = query.contains('product_colors', [{ id: params.color_id }]);
      }

      // فلترة حسب حالة النشاط
      if (params.is_active === undefined || params.is_active === '' || params.is_active === 'all') {
        // لا تضف شرط is_active (أظهر كل المنتجات)
      } else {
        query = query.eq('is_active', params.is_active === 'true');
      }

      // دعم قيم فرز ودية للمستخدم
      const sortMapping: Record<string, string> = {
        newest: 'created_at',
        price: 'price',
        discount: 'discount_percentage',
      };

      // --- تعديل القيم الافتراضية للصفحات ---
      const page = Number(params.page) > 0 ? Number(params.page) : 1;
      const limit = Number(params.limit) > 0 ? Number(params.limit) : 100;
      // --- نهاية التعديل ---

      const orderColumn = sortMapping[params.sort as string] || params.sort || 'created_at';
      const orderDirection = params.order || 'desc';
      query = query.order(orderColumn, { ascending: orderDirection === 'asc' });

      // التصفح
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`خطأ في جلب المنتجات: ${error.message}`);
      }

      const result = {
        success: true,
        data: {
          data: data || [],
          pagination: {
            page: params.page,
            limit: params.limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / params.limit)
          }
        }
      };

      // حفظ في Cache لمدة 15 دقيقة
      setCache(cacheKey, result, 15);

      return result;
    }, 'GET Products');
  }
}

const handler = new ProductsApiHandler();

export async function GET(request: NextRequest) {
  // تطبيق Rate Limiting
  const rateLimitResponse = await rateLimitMiddleware(request, apiRateLimiter);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return handler.handleProductsGet(request);
}

// POST - إضافة منتج جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      cost_price,
      category_id, // أضف category_id
      category_type,
      stock_quantity,
      is_active = true,
      is_popular = false,
      is_featured = false,
      is_exclusive = false,
      is_new = true,
      discount_percentage = 0,
      image,
      images = [],
      colors = [],
      sku,
      slug
    } = body;

    // التحقق من صحة البيانات المطلوبة
    if (!name || !description || !price || !category_id || !category_type || stock_quantity === undefined || !sku || !slug) {
      return NextResponse.json(
        { success: false, message: 'جميع الحقول المطلوبة يجب أن تكون مملوءة (بما في ذلك التصنيف category_id وsku وslug)' },
        { status: 400 }
      );
    }

    // تحقق من صحة category_id (UUID موجود في جدول categories)
    const { data: categoryExists } = await supabase.from('categories').select('id').eq('id', category_id).maybeSingle();
    if (!categoryExists) {
      return NextResponse.json(
        { success: false, message: 'التصنيف المختار غير موجود أو غير صالح' },
        { status: 400 }
      );
    }

    // تحقق من صحة slug
    if (!/^[a-z0-9\-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, message: 'صيغة الرابط slug غير صحيحة. يجب أن يحتوي فقط على أحرف إنجليزية صغيرة، أرقام، و-.' },
        { status: 400 }
      );
    }

    // تحقق من uniqueness للـ sku وslug
    const { data: skuExists } = await supabase.from('products').select('id').eq('sku', sku).maybeSingle();
    if (skuExists) {
      return NextResponse.json(
        { success: false, message: 'كود المنتج (SKU) مستخدم من قبل. اختر كود آخر.' },
        { status: 400 }
      );
    }
    const { data: slugExists } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle();
    if (slugExists) {
      return NextResponse.json(
        { success: false, message: 'الرابط المخصص (slug) مستخدم من قبل. اختر رابط آخر.' },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: 'السعر يجب أن يكون أكبر من صفر' },
        { status: 400 }
      );
    }

    if (discount_percentage < 0 || discount_percentage > 100) {
      return NextResponse.json(
        { error: 'نسبة الخصم يجب أن تكون بين 0 و 100' },
        { status: 400 }
      );
    }

    // إضافة المنتج
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price: parseFloat(price),
        cost_price: cost_price ? parseFloat(cost_price) : null,
        category_id, // أضف category_id
        category_type,
        stock_quantity: parseInt(stock_quantity),
        is_active,
        is_popular,
        is_featured,
        is_exclusive,
        is_new,
        discount_percentage: parseFloat(discount_percentage),
        image: image || images[0] || null,
        sku,
        slug
      })
      .select()
      .single();

    if (productError) {
      console.error('خطأ في إضافة المنتج:', productError);
      return NextResponse.json(
        { success: false, message: 'فشل في إضافة المنتج', error: productError.message },
        { status: 500 }
      );
    }

    // إضافة الصور إذا كانت موجودة
    if (images && images.length > 0) {
      const imageInserts = images.map((imageUrl: string, index: number) => ({
        product_id: product.id,
        image_url: imageUrl,
        display_order: index,
        is_primary: index === 0
      }));

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (imagesError) {
        console.warn('تحذير: فشل في إضافة بعض صور المنتج:', imagesError);
      }
    }

    // إضافة الألوان إذا كانت موجودة
    if (colors && colors.length > 0) {
      const colorInserts = colors.map((color: any) => ({
        product_id: product.id,
        color_name: color.name,
        color_code: color.hex || color.hexCode,
        is_available: color.isAvailable ?? true,
        stock_quantity: color.stock || 0
      }));

      const { error: colorsError } = await supabase
        .from('product_colors')
        .insert(colorInserts);

      if (colorsError) {
        console.warn('تحذير: فشل في إضافة بعض ألوان المنتج:', colorsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم إضافة المنتج بنجاح',
      data: product
    });

  } catch (error: any) {
    console.error('خطأ في إضافة المنتج:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم', error: error.message },
      { status: 500 }
    );
  }
} 