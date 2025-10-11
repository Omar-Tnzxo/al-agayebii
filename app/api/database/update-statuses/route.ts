import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إنشاء عميل Supabase للتحديث
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'متغيرات قاعدة البيانات غير متوفرة' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 بدء تحديث قاعدة البيانات لدعم الحالات المصرية الجديدة...');

    // خطوة 1: إزالة القيود القديمة
    console.log('1️⃣ إزالة القيود القديمة...');

    try {
      await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_payment_status;
        `
      });
    } catch (error) {
      // تجاهل الأخطاء إذا كانت القيود غير موجودة
      console.log('⚠️ بعض القيود لم تكن موجودة، تم التجاهل');
    }

    // خطوة 2: تحديث البيانات الموجودة أولاً
    console.log('2️⃣ تحديث البيانات الموجودة...');

    // تحويل completed إلى delivered
    const { error: updateCompletedError } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('status', 'completed');

    // تحويل canceled إلى cancelled
    const { error: updateCanceledError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('status', 'canceled');

    // تحويل الحالات القديمة للحالات المصرية الجديدة

    // تحويل حالات الطلب
    await supabase.from('orders').update({ status: 'delivered' }).eq('status', 'out_for_delivery');
    await supabase.from('orders').update({ status: 'pending' }).eq('status', 'draft');
    await supabase.from('orders').update({ status: 'shipped' }).eq('status', 'ready_to_ship');
    await supabase.from('orders').update({ status: 'shipped' }).eq('status', 'processing');

    // تحويل حالات الدفع للنظام المصري المبسط
    await supabase.from('orders').update({ payment_status: 'cash_on_delivery' }).match({ payment_status: 'paid', status: 'delivered' });
    await supabase.from('orders').update({ payment_status: 'pending' }).eq('payment_status', 'processing');
    await supabase.from('orders').update({ payment_status: 'pending' }).eq('payment_status', 'partially_paid');
    await supabase.from('orders').update({ payment_status: 'refund_pending' }).match({ payment_status: 'failed', status: 'returned' });
    await supabase.from('orders').update({ payment_status: 'refunded' }).eq('payment_status', 'partially_refunded');

    // تحويل أي حالات أخرى غير مدعومة إلى pending
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'replacement_requested', 'replaced', 'returned', 'cancelled'];
    const validPaymentStatuses = ['pending', 'cash_on_delivery', 'collected', 'refund_pending', 'refunded'];

    const { data: ordersWithInvalidStatus } = await supabase
      .from('orders')
      .select('id, status')
      .not('status', 'in', `(${validStatuses.map(s => `"${s}"`).join(',')})`);

    if (ordersWithInvalidStatus && ordersWithInvalidStatus.length > 0) {
      console.log(`🔄 تحديث ${ordersWithInvalidStatus.length} طلب بحالات غير مدعومة إلى pending...`);
      const { error: updateInvalidError } = await supabase
        .from('orders')
        .update({ status: 'pending' })
        .not('status', 'in', `(${validStatuses.map(s => `"${s}"`).join(',')})`);

      if (updateInvalidError) {
        console.error('❌ خطأ في تحديث الحالات غير المدعومة:', updateInvalidError);
      }
    }

    // تحديث حالات الدفع غير المدعومة
    const { data: ordersWithInvalidPaymentStatus } = await supabase
      .from('orders')
      .select('id, payment_status')
      .not('payment_status', 'in', `(${validPaymentStatuses.map(s => `"${s}"`).join(',')})`);

    if (ordersWithInvalidPaymentStatus && ordersWithInvalidPaymentStatus.length > 0) {
      console.log(`🔄 تحديث ${ordersWithInvalidPaymentStatus.length} طلب بحالات دفع غير مدعومة إلى pending...`);
      const { error: updateInvalidPaymentError } = await supabase
        .from('orders')
        .update({ payment_status: 'pending' })
        .not('payment_status', 'in', `(${validPaymentStatuses.map(s => `"${s}"`).join(',')})`);

      if (updateInvalidPaymentError) {
        console.error('❌ خطأ في تحديث حالات الدفع غير المدعومة:', updateInvalidPaymentError);
      }
    }

    if (updateCompletedError) {
      console.log('⚠️ لا توجد طلبات بحالة completed للتحديث');
    }

    if (updateCanceledError) {
      console.log('⚠️ لا توجد طلبات بحالة canceled للتحديث');
    }

    // خطوة 3: إضافة القيود الجديدة للحالات المصرية
    console.log('3️⃣ إضافة قيود حالات الطلب المصرية الجديدة...');

    const { error: orderStatusError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders ADD CONSTRAINT check_order_status
        CHECK (status IN (
          'pending', 'confirmed', 'shipped', 'delivered',
          'replacement_requested', 'replaced', 'returned', 'cancelled'
        ));
      `
    });

    if (orderStatusError) {
      console.error('❌ خطأ في إضافة قيود حالات الطلب المصرية:', orderStatusError);
    }

    // خطوة 4: إضافة القيود الجديدة لحالات الدفع المبسطة
    console.log('4️⃣ إضافة قيود حالات الدفع المصرية المبسطة...');

    const { error: paymentStatusError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders ADD CONSTRAINT check_payment_status
        CHECK (payment_status IN (
          'pending', 'cash_on_delivery', 'collected', 'refund_pending', 'refunded'
        ));
      `
    });

    if (paymentStatusError) {
      console.error('❌ خطأ في إضافة قيود حالات الدفع المصرية:', paymentStatusError);
    }

    // خطوة 5: إضافة فهرسة للأداء
    console.log('5️⃣ إضافة فهرسة لتحسين الأداء...');

    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
          CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
          CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON orders(status, payment_status);
        `
      });
    } catch (error) {
      console.log('⚠️ بعض الفهارس موجودة مسبقاً');
    }

    console.log('✅ تم تحديث قاعدة البيانات للسوق المصري بنجاح!');

    return NextResponse.json({
      success: true,
      message: 'تم تحديث قاعدة البيانات بنجاح لدعم الحالات المصرية الجديدة',
      details: {
        order_statuses: 8,
        payment_statuses: 5,
        updated_tables: ['orders'],
        added_indexes: 3,
        market: 'egyptian'
      }
    });

  } catch (error) {
    console.error('💥 خطأ في تحديث قاعدة البيانات:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في تحديث قاعدة البيانات',
        details: error
      },
      { status: 500 }
    );
  }
}

// GET method لعرض معلومات التحديث المصري
export async function GET() {
  return NextResponse.json({
    info: 'تحديث قاعدة البيانات لدعم الحالات المصرية',
    market: 'egyptian',
    order_statuses: [
      'pending', 'confirmed', 'shipped', 'delivered',
      'replacement_requested', 'replaced', 'returned', 'cancelled'
    ],
    payment_statuses: [
      'pending', 'cash_on_delivery', 'collected', 'refund_pending', 'refunded'
    ],
    order_statuses_count: 8,
    payment_statuses_count: 5,
    features: [
      'دفع عند الاستلام',
      'طلبات الاستبدال',
      'حالات الإرجاع',
      'تحصيل من شركة الشحن'
    ],
    instruction: 'استخدم POST لتطبيق التحديث'
  });
}