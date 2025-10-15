import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// إنشاء عميل Supabase مباشرة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// دوال للتحقق من صحة الحالات وربطها (النظام المصري المبسط)
const getAvailablePaymentStatuses = (orderStatus: string): string[] => {
  switch (orderStatus) {
    case 'pending':
      return ['pending'];
    case 'confirmed':
      return ['pending'];
    case 'shipped':
      return ['pending', 'cash_on_delivery'];
    case 'delivered':
      return ['cash_on_delivery', 'collected'];
    case 'replacement_requested':
      return ['cash_on_delivery', 'collected', 'refund_pending'];
    case 'replaced':
      return ['pending', 'cash_on_delivery'];
    case 'returned':
      return ['refund_pending', 'refunded'];
    case 'cancelled':
      return ['pending', 'refunded'];
    default:
      return ['pending', 'cash_on_delivery', 'collected', 'refund_pending', 'refunded'];
  }
};

const validateStatusCompatibility = (orderStatus: string, paymentStatus: string): boolean => {
  const availablePaymentStatuses = getAvailablePaymentStatuses(orderStatus);
  return availablePaymentStatuses.includes(paymentStatus);
};

const getAutoPaymentStatus = (orderStatus: string, currentPaymentStatus: string): string | null => {
  switch (orderStatus) {
    case 'pending':
    case 'confirmed':
      // الطلبات الجديدة تبقى في انتظار الدفع
      return currentPaymentStatus !== 'pending' ? 'pending' : null;
    case 'shipped':
      // عند الشحن، يصبح الدفع في انتظار التسليم للعميل
      return currentPaymentStatus === 'pending' ? 'pending' : null;
    case 'delivered':
      // عند التسليم، العميل يدفع للمندوب
      return currentPaymentStatus === 'pending' ? 'cash_on_delivery' : null;
    case 'replacement_requested':
      // طلب الاستبدال - يحتفظ بالحالة الحالية أو ينتظر الإرجاع
      return ['pending', 'cash_on_delivery'].includes(currentPaymentStatus) ? 'refund_pending' : null;
    case 'replaced':
      // تم الاستبدال - طلب جديد، دفع جديد
      return 'pending';
    case 'returned':
      // الطلب مرتجع - في انتظار إرجاع المال
      return currentPaymentStatus === 'cash_on_delivery' ? 'refund_pending' : null;
    case 'cancelled':
      // الطلب ملغي - إرجاع المال إذا كان مدفوع
      return currentPaymentStatus === 'cash_on_delivery' ? 'refunded' : null;
    default:
      return null;
  }
};

// قراءة الطلبات المحلية من الملف
function loadLocalOrders(): any[] {
  try {
    const ordersFile = path.join(process.cwd(), 'local-orders.json');
    if (fs.existsSync(ordersFile)) {
      const data = fs.readFileSync(ordersFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('خطأ في قراءة الطلبات المحلية:', error);
  }
  return [];
}

// جلب طلب واحد بـ ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 طلب جلب الطلب بـ ID: ${id}`);

    // أولاً، ابحث في الطلبات المحلية
    const localOrders = loadLocalOrders();
    const localOrder = localOrders.find(order => order.id === id);

    if (localOrder) {
      console.log('✅ تم العثور على الطلب في التخزين المحلي');
      // تحويل الطلب المحلي لتنسيق موحد
      const transformedOrder = {
        id: localOrder.id,
        customer_name: localOrder.customer_name || 'غير محدد',
        customer_phone: localOrder.customer_phone || 'غير محدد',
        customer_email: localOrder.customer_email || null,
        address: localOrder.address || 'غير محدد',
        status: localOrder.status || 'pending',
        total: localOrder.total || 0,
        payment_method: localOrder.payment_method || 'غير محدد',
        created_at: localOrder.created_at,
        updated_at: localOrder.created_at,
        items_count: localOrder.items?.length || 0,
        order_items: localOrder.items || [],
        source: 'local_storage'
      };

      return NextResponse.json({
        success: true,
        data: transformedOrder
      });
    }

    // إذا لم يتم العثور على الطلب محلياً، ابحث في قاعدة البيانات
    console.log('🔍 البحث في قاعدة البيانات...');
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'قاعدة البيانات غير متوفرة' },
        { status: 500 }
      );
    }

    // محاولة جلب الطلب من قاعدة البيانات
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ خطأ في جلب الطلب من قاعدة البيانات:', error);
      return NextResponse.json(
        { error: 'لم يتم العثور على الطلب' },
        { status: 404 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'لم يتم العثور على الطلب' },
        { status: 404 }
      );
    }

    // استخراج معلومات العميل من الحقول المباشرة في الجدول
    const customerName = order.customer_name || 'غير محدد';
    const customerPhone = order.customer_phone || 'غير محدد';
    const address = order.address || 'غير محدد';

    // محاولة جلب عناصر الطلب مع معلومات المنتج والتكلفة
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        product_id,
        product_name,
        product_image,
        quantity,
        price,
        total_price,
        products:product_id(
          id,
          name,
          image,
          sku,
          slug,
          cost_price
        )
      `)
      .eq('order_id', id);

    // حساب التكلفة والربح
    let totalCost = 0;
    let totalProfit = 0;

    if (orderItems && Array.isArray(orderItems)) {
      totalCost = orderItems.reduce((sum: number, item: any) => {
        const costPrice = item.products?.cost_price || 0;
        return sum + (costPrice * item.quantity);
      }, 0);

      totalProfit = (order.total || 0) - totalCost - (order.shipping_cost || 0);
    }

    // تحويل البيانات لتنسيق موحد مع جميع الحقول
    const transformedOrder = {
      id: order.id,
      order_number: order.order_number || null,
      customer_name: customerName,
      customer_phone: customerPhone,
      address: address,
      governorate: order.governorate || null,
      status: order.status || 'pending',
      payment_status: order.payment_status || 'pending',
      payment_method: order.payment_method || 'غير محدد',
      total: order.total || 0,
      shipping_cost: order.shipping_cost || 0,
      tax_amount: order.tax_amount || 0,
      discount_amount: order.discount_amount || 0,
      shipping_company: order.shipping_company || null,
      estimated_delivery: order.estimated_delivery || null,
      actual_delivery_date: order.actual_delivery_date || null,
      customer_notes: order.customer_notes || null,
      admin_notes: order.admin_notes || null,
      shipping_method: order.shipping_method || 'standard',
      created_at: order.created_at,
      updated_at: order.updated_at || order.created_at,
      shipped_at: order.shipped_at || null,
      completed_at: order.completed_at || null,
      order_items: orderItems || [],
      total_cost: totalCost,
      total_profit: totalProfit,
      source: 'database'
    };

    console.log('✅ تم جلب الطلب من قاعدة البيانات بنجاح');

    return NextResponse.json({
      success: true,
      data: transformedOrder
    });

  } catch (error: any) {
    console.error('💥 خطأ عام في جلب الطلب:', error);
    return NextResponse.json(
      { error: `خطأ في جلب الطلب: ${error.message}` },
      { status: 500 }
    );
  }
}

// PATCH - تحديث جزئي (حالة الطلب أو حالة الدفع)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'قاعدة البيانات غير متوفرة' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('📝 طلب تحديث الطلب:', body);

    // دعم جميع الحقول القابلة للتحديث
    const {
      status,
      payment_status,
      shipping_company,
      estimated_delivery,
      actual_delivery_date,
      shipping_method,
      shipping_cost,
      tax_amount,
      discount_amount,
      admin_notes
    } = body;

    // جلب الحالة الحالية للطلب
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status, payment_status')
      .eq('id', id)
      .single();

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    // تحديث الحقول المرسلة مع التحقق من صحة الحالات
    let finalOrderStatus = currentOrder.status;
    let finalPaymentStatus = currentOrder.payment_status;

    // إذا تم تحديث حالة الطلب
    if (status !== undefined) {
      finalOrderStatus = status;
      updates.status = status;

      // التحديث التلقائي لحالة الدفع بناءً على حالة الطلب
      const autoPaymentStatus = getAutoPaymentStatus(status, currentOrder.payment_status);
      if (autoPaymentStatus && autoPaymentStatus !== currentOrder.payment_status) {
        finalPaymentStatus = autoPaymentStatus;
        updates.payment_status = autoPaymentStatus;
        console.log(`🔄 تحديث تلقائي لحالة الدفع من ${currentOrder.payment_status} إلى ${autoPaymentStatus}`);
      }
    }

    // إذا تم تحديث حالة الدفع، تحقق من التوافق
    if (payment_status !== undefined) {
      const isCompatible = validateStatusCompatibility(finalOrderStatus, payment_status);
      if (!isCompatible) {
        const availableStatuses = getAvailablePaymentStatuses(finalOrderStatus);
        return NextResponse.json(
          {
            error: `حالة الدفع "${payment_status}" غير متوافقة مع حالة الطلب "${finalOrderStatus}"`,
            available_payment_statuses: availableStatuses
          },
          { status: 400 }
        );
      }
      finalPaymentStatus = payment_status;
      updates.payment_status = payment_status;
    }

    // باقي التحديثات
    if (shipping_company !== undefined) updates.shipping_company = shipping_company;
    if (estimated_delivery !== undefined) updates.estimated_delivery = estimated_delivery;
    if (actual_delivery_date !== undefined) updates.actual_delivery_date = actual_delivery_date;
    if (shipping_method !== undefined) updates.shipping_method = shipping_method;
    if (shipping_cost !== undefined) updates.shipping_cost = parseFloat(shipping_cost);
    if (tax_amount !== undefined) updates.tax_amount = parseFloat(tax_amount);
    if (discount_amount !== undefined) updates.discount_amount = parseFloat(discount_amount);
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    console.log('📊 التحديثات المطلوبة:', updates);

    // حفظ الحالة القديمة لسجل التغيير
    const oldStatus = currentOrder.status;

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('خطأ في تحديث الطلب:', error);
      return NextResponse.json(
        { error: 'فشل في تحديث الطلب', details: error.message },
        { status: 500 }
      );
    }

    // لا حاجة لإضافة سجل يدوياً - الـ trigger في قاعدة البيانات سيتولى ذلك
    // تم إزالة الكود المكرر لتجنب التسجيل المزدوج

    console.log('✅ تم تحديث الطلب بنجاح');
    return NextResponse.json({ success: true, message: 'تم تحديث الطلب بنجاح' });

  } catch (error: any) {
    console.error('💥 خطأ عام في PATCH الطلب:', error);
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - حذف طلب
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🗑️ طلب حذف الطلب: ${id}`);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'قاعدة البيانات غير متوفرة' },
        { status: 500 }
      );
    }

    // التحقق من وجود الطلب أولاً
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    // حذف تاريخ تغيير الحالات أولاً (إذا وجد)
    await supabaseAdmin
      .from('order_status_history')
      .delete()
      .eq('order_id', id);

    // حذف عناصر الطلب أولاً (إذا وجدت)
    await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', id);

    // حذف الطلب نفسه
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ خطأ في حذف الطلب:', error);
      return NextResponse.json(
        { error: 'فشل في حذف الطلب', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ تم حذف الطلب بنجاح');
    return NextResponse.json({
      success: true,
      message: 'تم حذف الطلب بنجاح'
    });

  } catch (error: any) {
    console.error('💥 خطأ عام في DELETE الطلب:', error);
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم', details: error.message },
      { status: 500 }
    );
  }
}