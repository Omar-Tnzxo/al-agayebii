import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { customAlphabet } from 'nanoid';
import { getSiteSettings } from '@/lib/site-settings';

// إنشاء عميل Supabase آمن
const createSupabaseClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return null;
    }
    
    console.log('Creating Supabase client with URL:', supabaseUrl);
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

const supabaseAdmin = createSupabaseClient();

// تخزين مؤقت للطلبات (في حالة فشل قاعدة البيانات)
import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'local-orders.json');

// قراءة الطلبات المحلية من الملف
function loadLocalOrders(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('خطأ في قراءة الطلبات المحلية:', error);
  }
  return [];
}

// حفظ الطلبات المحلية في الملف
function saveLocalOrders(orders: any[]): void {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('خطأ في حفظ الطلبات المحلية:', error);
  }
}

// إضافة طلب جديد للتخزين المحلي
function addLocalOrder(order: any): void {
  const orders = loadLocalOrders();
  orders.push(order);
  saveLocalOrders(orders);
}

// إزالة المتغير الثابت واستخدام دالة loadLocalOrders() مباشرة عند الحاجة

// مخطط التحقق من بيانات الطلب
const orderSchema = z.object({
  customer_name: z.string().min(2, { message: 'يجب أن يكون اسم العميل حرفين على الأقل' }),
  customer_phone: z.string().min(8, { message: 'رقم الهاتف غير صالح' }),
  address: z.string().min(5, { message: 'يجب أن يكون العنوان 5 أحرف على الأقل' }),
  governorate: z.string().optional(),
  payment_method: z.string(),
  items: z.array(
    z.object({
      product_id: z.string(),
      quantity: z.number().int().min(1, { message: 'يجب أن تكون الكمية على الأقل 1' }),
      price: z.number().min(0, { message: 'يجب أن يكون السعر أكبر من أو يساوي صفر' })
    })
  ).min(1, { message: 'يجب أن يحتوي الطلب على منتج واحد على الأقل' }),
  total: z.number().min(0, { message: 'يجب أن يكون المجموع أكبر من أو يساوي صفر' }),
  shipping_cost: z.number().min(0).optional().default(0),
});

// دالة توليد كود أوردر فريد وقصير
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);
async function generateUniqueOrderCode() {
  let code;
  let exists = true;
  while (exists) {
    code = nanoid();
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', code)
      .maybeSingle();
    exists = !!data;
  }
  return code;
}

// GET - جلب جميع الطلبات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order_number');
    if (orderNumber) {
      // جلب طلب واحد فقط عبر order_number
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            product_id,
            product_name,
            product_image,
            products (
              id,
              name,
              cost_price
            )
          )
        `)
        .eq('order_number', orderNumber)
        .single();
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
        }
        console.error('خطأ في جلب الطلب:', error);
        return NextResponse.json({ error: 'فشل في جلب الطلب', details: process.env.NODE_ENV !== 'production' ? error.message : undefined }, { status: 500 });
      }
      if (!order) {
        return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
      }

      // حساب التكلفة والربح للطلب الواحد
      let totalCost = 0;
      let totalProfit = 0;

      if (order.order_items && Array.isArray(order.order_items)) {
        totalCost = order.order_items.reduce((sum: number, item: any) => {
          const costPrice = item.products?.cost_price || 0;
          return sum + (costPrice * item.quantity);
        }, 0);

        totalProfit = order.total - totalCost - (order.shipping_cost || 0);
      }

      const orderWithProfit = {
        ...order,
        total_cost: totalCost,
        total_profit: totalProfit
      };

      return NextResponse.json({ success: true, data: orderWithProfit });
    }
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('payment_status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            image,
            cost_price
          )
        )
      `);

    // البحث برقم الطلب أو بيانات العميل
    if (search) {
      query = query.or(`
        order_number.ilike.%${search}%,
        customer_name.ilike.%${search}%,
        customer_phone.ilike.%${search}%
      `);
    }

    // فلترة حسب حالة الطلب
    if (status) {
      query = query.eq('status', status);
    }

    // فلترة حسب حالة الدفع
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    // الترتيب
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // التصفح بالصفحات
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('خطأ في جلب الطلبات:', error);
      return NextResponse.json(
        {
          error: 'فشل في جلب الطلبات',
          details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // حساب التكلفة والربح لكل طلب
    const ordersWithProfit = orders?.map(order => {
      let totalCost = 0;
      let totalProfit = 0;

      if (order.order_items && Array.isArray(order.order_items)) {
        // حساب إجمالي التكلفة من العناصر
        totalCost = order.order_items.reduce((sum: number, item: any) => {
          const costPrice = item.products?.cost_price || 0;
          return sum + (costPrice * item.quantity);
        }, 0);

        // حساب الربح = إجمالي الطلب - التكلفة - تكلفة الشحن
        totalProfit = order.total - totalCost - (order.shipping_cost || 0);
      }

      return {
        ...order,
        total_cost: totalCost,
        total_profit: totalProfit
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: ordersWithProfit,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('خطأ في API الطلبات:', error);
    return NextResponse.json(
      { 
        error: 'خطأ داخلي في الخادم', 
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

// POST - إضافة طلب جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let {
      customer_name,
      customer_phone,
      address, // تم تغيير من shipping_address إلى address
      items,
      total,
      payment_method, // إضافة payment_method المطلوب
      shipping_method = 'standard',
      shipping_cost,
      notes = '',
      governorate
    } = body;

    // التحقق من صحة البيانات المطلوبة
    if (!customer_name || !customer_phone || !address || !items || total === undefined || !payment_method) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة مفقودة: customer_name, customer_phone, address, items, total, payment_method' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'يجب أن يحتوي الطلب على منتج واحد على الأقل' },
        { status: 400 }
      );
    }

    // جلب إعدادات الموقع إذا لم يتم تمرير قيمة الشحن أو كانت غير صالحة
    let shippingCompanyName = '';
    if (shipping_cost === undefined || shipping_cost === null || isNaN(Number(shipping_cost)) || Number(shipping_cost) < 0) {
      const settings = await getSiteSettings();
      shipping_cost = Number(settings.shipping_cost) || 0;
      shippingCompanyName = settings.shipping_company_name || 'شركة الشحن الرئيسية';
    } else {
      // جلب اسم شركة الشحن حتى لو تم تمرير التكلفة
      const settings = await getSiteSettings();
      shippingCompanyName = settings.shipping_company_name || 'شركة الشحن الرئيسية';
    }

    // إنشاء رقم طلب فريد وقصير
    const orderNumber = await generateUniqueOrderCode();

    // حساب المجموع الفرعي من العناصر
    const subTotal = items.reduce((sum:number, itm:any) => sum + (parseFloat(itm.price) * parseInt(itm.quantity)), 0);
    // المجموع النهائي = المجموع الفرعي + تكلفة الشحن
    const grandTotal = subTotal + parseFloat(shipping_cost);

    // إضافة الطلب
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        address: address.trim(),
        governorate: governorate, // تأكد أنها هنا
        total: grandTotal,
        shipping_cost: parseFloat(shipping_cost),
        shipping_company: shippingCompanyName,
        payment_method: payment_method.trim(),
        shipping_method,
        customer_notes: notes.trim(),
        status: 'pending'
      }])
      .select() // بدون تحديد أعمدة
      .single();

    if (orderError) {
      console.error('خطأ في إضافة الطلب:', orderError);
      return NextResponse.json(
        { 
          error: 'فشل في إضافة الطلب', 
          details: process.env.NODE_ENV !== 'production' ? orderError.message : undefined 
        },
        { status: 500 }
      );
    }

    // إضافة عناصر الطلب
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: String(item.product_id), // تحويل إلى نص لدعم VARCHAR
      product_name: item.product_name || '', // إضافة اسم المنتج
      product_image: item.product_image || '', // إضافة صورة المنتج
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
      total_price: parseFloat(item.price) * parseInt(item.quantity) // حساب الإجمالي
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('خطأ في إضافة عناصر الطلب:', itemsError);
      // حذف الطلب في حالة فشل إضافة العناصر
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        {
          error: 'فشل في إضافة عناصر الطلب',
          details: process.env.NODE_ENV !== 'production' ? itemsError.message : undefined
        },
        { status: 500 }
      );
    }

    // تحديث المخزون لكل منتج
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (!productError && product) {
        const newStock = product.stock_quantity - parseInt(item.quantity);
        await supabase
          .from('products')
          .update({ stock_quantity: Math.max(0, newStock) })
          .eq('id', item.product_id);
      }
    }

    // إرسال إشعار تلقائي بعد نجاح إضافة الطلب
    try {
      await supabase
        .from('notifications')
        .insert([
          {
            message: `تم استلام طلب جديد من ${customer_name}`,
            type: 'order',
          },
        ]);
    } catch (notifyErr) {
      console.error('فشل في إرسال إشعار الطلب الجديد:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الطلب بنجاح',
      data: order
    }, { status: 201 });

  } catch (error: any) {
    console.error('خطأ في إضافة الطلب:', error);
    return NextResponse.json(
      { 
        error: 'خطأ داخلي في الخادم', 
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

// PUT - تحديث حالة الطلب
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, payment_status } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'معرف الطلب مطلوب' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للتحديث' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث الطلب:', error);
      return NextResponse.json(
        { 
          error: 'فشل في تحديث الطلب', 
          details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الطلب بنجاح',
      data: order
    });

  } catch (error: any) {
    console.error('خطأ في تحديث الطلب:', error);
    return NextResponse.json(
      { 
        error: 'خطأ داخلي في الخادم', 
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
} 