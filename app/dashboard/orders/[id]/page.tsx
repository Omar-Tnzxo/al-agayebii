import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import fs from 'fs';
import path from 'path';
import { createWhatsAppLink } from '@/lib/utils/helpers';
import { formatPrice } from '@/lib/utils/format-number';
import PrintButton from '@/components/PrintButton';

export const metadata: Metadata = {
  title: 'تفاصيل الطلب | لوحة التحكم',
  description: 'عرض وإدارة تفاصيل الطلب',
};

// قراءة الطلبات المحلية
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

// صفحة تفاصيل الطلب (Server Component)
export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  // انتظار المعاملات أولاً
  const { id } = params;
  
  console.log('🚀 محاولة جلب الطلب بـ ID:', id);
  
  // أولاً، ابحث في الطلبات المحلية
  const localOrders = loadLocalOrders();
  const localOrder = localOrders.find(order => order.id === id);
  
  if (localOrder) {
    console.log('✅ تم العثور على الطلب في التخزين المحلي:', localOrder.id);
    
    // عرض تفاصيل الطلب المحلي
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/dashboard/orders" 
            className="text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </Link>
          <h1 className="text-2xl font-bold">تفاصيل الطلب #{localOrder.id?.substring(0, 8)}</h1>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">محلي</span>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-4">بيانات الطلب</h2>
          <div className="space-y-4">
            <div>
              <span className="font-medium">اسم العميل: </span>
              <span>{localOrder.customer_name || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">البريد الإلكتروني: </span>
              <span>{localOrder.customer_email || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">رقم الهاتف: </span>
              <span>{localOrder.customer_phone || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">العنوان: </span>
              <span>{localOrder.address || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">المجموع: </span>
              <span>{localOrder.total || 0} جنيه</span>
            </div>
            <div>
              <span className="font-medium">الحالة: </span>
              <span className="inline-block px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                {localOrder.status === 'pending' ? 'قيد الانتظار' : 
                 localOrder.status === 'processing' ? 'قيد المعالجة' : 
                 localOrder.status === 'completed' ? 'مكتمل' : 
                 localOrder.status === 'canceled' ? 'ملغي' : 
                 localOrder.status || 'غير محدد'}
              </span>
            </div>
            <div>
              <span className="font-medium">طريقة الدفع: </span>
              <span>{localOrder.payment_method === 'cash' ? 'الدفع عند الاستلام' : 
                     localOrder.payment_method === 'card' ? 'بطاقة ائتمان' : 
                     localOrder.payment_method || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">تاريخ الإنشاء: </span>
              <span>{localOrder.created_at ? new Date(localOrder.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">المصدر: </span>
              <span className="text-sm text-blue-600">محفوظ محلياً</span>
            </div>
          </div>
          
          {/* عرض عناصر الطلب */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">عناصر الطلب</h3>
            {localOrder.items && localOrder.items.length > 0 ? (
              <div className="space-y-3">
                {localOrder.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">
                        منتج {item.product_id}
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>الكمية: {item.quantity}</span>
                        <span className="mx-2">•</span>
                        <span>سعر الوحدة: {formatPrice(item.price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg">
                        {(item.quantity * item.price).toFixed(2)} جنيه
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>المجموع الكلي:</span>
                    <span>{localOrder.total || 0} جنيه</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد عناصر للطلب</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // إذا لم يتم العثور على الطلب محلياً، ابحث في قاعدة البيانات
  console.log('🔍 البحث في قاعدة البيانات...');
  
  try {
    // أولاً، جرب جلب جميع الطلبات لمقارنة الـ IDs (استخدام الأعمدة الصحيحة)
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('id, address, created_at, total')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allOrdersError) {
      console.error('❌ خطأ في جلب جميع الطلبات:', allOrdersError);
    } else {
      console.log('📋 آخر 10 طلبات في قاعدة البيانات:');
      allOrders.forEach((order, index) => {
        // استخراج اسم العميل من address
        const customerName = order.address?.split('\n')[0] || 'غير محدد';
        console.log(`   ${index + 1}. ID: ${order.id} | العميل: ${customerName}`);
      });
      
      // تحقق من وجود الـ ID المطلوب
      const orderExists = allOrders.find(order => order.id === id);
      console.log(`🔍 هل الطلب المطلوب موجود؟`, orderExists ? '✅ نعم' : '❌ لا');
    }
    
    // جلب بيانات الطلب الأساسية أولاً
    console.log('📦 محاولة جلب الطلب المحدد...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
      
    if (orderError) {
      console.error('❌ خطأ في جلب الطلب:', orderError);
      console.error('تفاصيل الخطأ:', {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details
      });
      
      // جرب البحث بدون single()
      console.log('🔄 محاولة البحث بدون single()...');
      const { data: searchResult, error: searchError } = await supabase
    .from('orders')
        .select('*')
        .eq('id', id);
        
      if (searchError) {
        console.error('❌ خطأ في البحث أيضاً:', searchError);
      } else {
        console.log(`🔍 نتائج البحث: ${searchResult.length} طلبات`);
        if (searchResult.length > 0) {
          console.log('✅ تم العثور على الطلب في البحث:', searchResult[0]);
        }
      }
      
      notFound();
    }
    
    if (!order) {
      console.error('❌ الطلب فارغ رغم عدم وجود خطأ');
      notFound();
    }
    
    console.log('✅ تم جلب الطلب بنجاح:', {
      id: order.id,
      order_number: order.order_number,
      address: order.address,
      total: order.total
    });
    
    // معلومات العميل من الحقول المباشرة
    const dbCustomerName = order.customer_name;
    const dbCustomerEmail = order.customer_email || 'غير محدد';
    const dbCustomerPhone = order.customer_phone;
    const dbAddress = order.address || 'غير محدد';
    const dbTotal = order.total;
    
    // جلب عناصر الطلب منفصلة
    console.log('🛒 محاولة جلب عناصر الطلب...');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
    .select(`
      *,
        products:product_id(id, name, image, price, sku, slug)
    `)
      .eq('order_id', id);
    
    if (itemsError) {
      console.error('⚠️ خطأ في جلب عناصر الطلب:', itemsError);
      // نستمر بعرض تفاصيل الطلب حتى لو فشل جلب العناصر
    } else {
      console.log(`✅ تم جلب ${orderItems.length} عنصر للطلب`);
    }
    
    // عرض تفاصيل الطلب
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/dashboard/orders" 
            className="text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </Link>
          <h1 className="text-2xl font-bold">تفاصيل الطلب #{order.order_number}</h1>
        </div>
        {/* أزرار واتساب والطباعة */}
        <div className="flex items-center gap-3 mb-6">
          <a
            href={createWhatsAppLink(dbCustomerPhone, `مرحباً ${dbCustomerName}، بخصوص طلبك رقم ${order.order_number}`)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            إرسال واتساب
          </a>
          {/* زر الطباعة أصبح مكوّن Client لمنع تمرير onClick داخل Server Component */}
          <PrintButton />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-4">بيانات الطلب</h2>
          <div className="space-y-4">
            <div>
              <span className="font-medium">اسم العميل: </span>
              <span>{dbCustomerName}</span>
            </div>
            <div>
              <span className="font-medium">البريد الإلكتروني: </span>
              <span>{dbCustomerEmail}</span>
            </div>
            <div>
              <span className="font-medium">رقم الهاتف: </span>
              <span>{dbCustomerPhone}</span>
            </div>
            <div>
              <span className="font-medium">العنوان: </span>
              <span>{dbAddress}</span>
            </div>
            <div>
              <span className="font-medium">المجموع: </span>
              <span>{dbTotal || 0} جنيه</span>
            </div>
            {order.shipping_cost !== null && (
              <div>
                <span className="font-medium">تكلفة الشحن: </span>
                <span>{order.shipping_cost} جنيه</span>
              </div>
            )}
            {order.shipping_method && (
              <div>
                <span className="font-medium">طريقة الشحن: </span>
                <span>{order.shipping_method === 'standard' ? 'عادي' : order.shipping_method === 'express' ? 'سريع' : order.shipping_method}</span>
              </div>
            )}
            <div>
              <span className="font-medium">الحالة: </span>
              <span className="inline-block px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                {order.status === 'pending' ? 'قيد الانتظار' : 
                 order.status === 'processing' ? 'قيد المعالجة' : 
                 order.status === 'completed' ? 'مكتمل' : 
                 order.status === 'canceled' ? 'ملغي' : 
                 order.status || 'غير محدد'}
              </span>
            </div>
            <div>
              <span className="font-medium">طريقة الدفع: </span>
              <span>{order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 
                     order.payment_method === 'card' ? 'بطاقة ائتمان' : 
                     order.payment_method || 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">تاريخ الإنشاء: </span>
              <span>{order.created_at ? new Date(order.created_at).toLocaleDateString('en-US') : 'غير محدد'}</span>
            </div>
            <div>
              <span className="font-medium">تاريخ التحديث: </span>
              <span>{order.updated_at ? new Date(order.updated_at).toLocaleDateString('en-US') : 'غير محدد'}</span>
            </div>
            {order.notes && (
              <div>
                <span className="font-medium">ملاحظات: </span>
                <span>{order.notes}</span>
              </div>
            )}
          </div>
          
          {/* عرض عناصر الطلب */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">عناصر الطلب</h3>
            {orderItems && orderItems.length > 0 ? (
              <div className="space-y-3">
                {orderItems.map((item: any, index: number) => (
                  <div key={item.id || index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">
                        {item.product?.name || `منتج ${item.product_id}`}
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>الكمية: {item.quantity}</span>
                        <span className="mx-2">•</span>
                        <span>سعر الوحدة: {formatPrice(item.price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg">
                        {(item.quantity * item.price).toFixed(2)} جنيه
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>المجموع الكلي:</span>
                    <span>{dbTotal || 0} جنيه</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد عناصر للطلب أو حدث خطأ في جلب البيانات</p>
                {itemsError && (
                  <p className="text-sm mt-2">خطأ: {itemsError.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('💥 خطأ غير متوقع في جلب الطلب:', error);
    notFound();
  }
}