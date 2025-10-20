import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// إنشاء عميل Supabase آمن
const createSupabaseClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables for track-order');
      return null;
    }
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Error creating Supabase client for track-order:', error);
    return null;
  }
};

const supabaseAdmin = createSupabaseClient();

// تخزين مؤقت للطلبات (مشارك مع orders API)
const ORDERS_FILE = path.join(process.cwd(), 'local-orders.json');

// قراءة الطلبات المحلية
const loadLocalOrders = () => {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('خطأ في قراءة الطلبات المحلية:', error);
  }
  return [];
};

// واجهة الطلب للتتبع المحدثة
interface TrackingOrder {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  governorate?: string;
  shipping_address: string;
  status: string;
  status_arabic: string;
  total: number;
  total_amount: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  payment_status?: string;
  payment_status_arabic?: string;
  shipping_company?: string;
  shipping_method?: string;
  estimated_delivery?: string;
  actual_delivery_date?: string;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  completed_at?: string;
  items_count: number;
  order_items: any[];
  status_history?: any[];
}

// تتبع الطلبات برقم الهاتف أو رقم الطلب
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order');
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'رقم الطلب مطلوب للتتبع' },
        { status: 400 }
      );
    }

    const searchType = 'order';
    const searchValue = orderNumber;
    
    console.log(`🔍 البحث عن طلبات بـ ${searchType}: ${searchValue}`);
    
    let orders: TrackingOrder[] = [];
    let isFromLocalStorage = false;
    
    // محاولة البحث في قاعدة البيانات أولاً
    if (supabaseAdmin) {
      try {
        console.log('🔍 البحث في قاعدة البيانات...');
        
        // البحث برقم الطلب مع جلب جميع التفاصيل
        let query = supabaseAdmin
          .from('orders')
          .select(`
            id,
            order_number,
            customer_name,
            customer_phone,
            address,
            governorate,
            status,
            payment_method,
            payment_status,
            total,
            shipping_cost,
            tax_amount,
            discount_amount,
            shipping_company,
            shipping_method,
            estimated_delivery,
            actual_delivery_date,
            customer_notes,
            admin_notes,
            created_at,
            updated_at,
            shipped_at,
            completed_at,
            order_items(
              id,
              product_id,
              product_name,
              product_image,
              quantity,
              price,
              total_price,
              products(name, image, sku, slug)
            )
          `);

        // تطبيق الفلتر برقم الطلب فقط
        query = query.eq('order_number', orderNumber);

        const { data: dbOrders, error } = await query.order('created_at', { ascending: false });
        
        if (!error && dbOrders && dbOrders.length > 0) {
          console.log(`✅ تم العثور على ${dbOrders.length} طلب في قاعدة البيانات`);
          
          // تحويل البيانات للتنسيق المطلوب
          orders = await Promise.all(dbOrders.map(async (order) => {
            // جلب تاريخ حالات الطلب
            const { data: statusHistory } = await supabaseAdmin
              .from('order_status_history')
              .select('old_status, new_status, notes, created_at')
              .eq('order_id', order.id)
              .order('created_at', { ascending: false });

            // تحويل حالة الطلب للعربية
            const statusMap: { [key: string]: string } = {
              'pending': 'قيد الانتظار',
              'confirmed': 'مؤكد',
              'shipped': 'تم الشحن',
              'delivered': 'تم التسليم',
              'replacement_requested': 'طلب استبدال',
              'replaced': 'تم الاستبدال',
              'returned': 'تم الإرجاع',
              'cancelled': 'ملغي'
            };

            // تحويل طريقة الدفع للعربية
            const paymentMethodMap: { [key: string]: string } = {
              'cash_on_delivery': 'دفع عند الاستلام',
              'cash': 'دفع عند الاستلام',
              'card': 'بطاقة ائتمان',
              'bank_transfer': 'تحويل بنكي',
              'mobile_wallet': 'محفظة إلكترونية'
            };

            // تحويل حالة الدفع للعربية
            const paymentStatusMap: { [key: string]: string } = {
              'pending': 'معلق',
              'cash_on_delivery': 'دفع عند الاستلام',
              'collected': 'تم التحصيل',
              'refund_pending': 'استرداد معلق',
              'refunded': 'تم الاسترداد'
            };

            return {
              id: order.id,
              order_number: order.order_number || order.id.substring(0, 8).toUpperCase(),
              customer_name: order.customer_name,
              customer_phone: order.customer_phone,
              address: order.address,
              governorate: order.governorate,
              shipping_address: order.address,
              status: order.status,
              status_arabic: statusMap[order.status] || order.status,
              total: order.total,
              total_amount: order.total,
              shipping_cost: order.shipping_cost || 0,
              tax_amount: order.tax_amount || 0,
              discount_amount: order.discount_amount || 0,
              payment_method: paymentMethodMap[order.payment_method] || order.payment_method,
              payment_status: order.payment_status,
              payment_status_arabic: paymentStatusMap[order.payment_status] || order.payment_status,
              shipping_company: order.shipping_company,
              shipping_method: order.shipping_method || 'standard',
              estimated_delivery: order.estimated_delivery,
              actual_delivery_date: order.actual_delivery_date,
              customer_notes: order.customer_notes,
              admin_notes: order.admin_notes,
              created_at: order.created_at,
              updated_at: order.updated_at,
              shipped_at: order.shipped_at,
              completed_at: order.completed_at,
              items_count: order.order_items?.length || 0,
              order_items: (order.order_items || []).map((item: any) => {
                // إعطاء الأولوية للبيانات المخزنة في order_items، ثم البيانات من جدول products
                const productData = item.products || {};
                return {
                  id: item.id,
                  product_id: item.product_id,
                  product_name: item.product_name || productData.name || 'غير محدد',
                  product_image: item.product_image || productData.image || '/images/product-default.png',
                  product_sku: productData.sku || null,
                  product_slug: productData.slug || null,
                  quantity: item.quantity,
                  price: item.price,
                  unit_price: item.price,
                  total_price: item.total_price || (item.price * item.quantity),
                  product: {
                    name: item.product_name || productData.name || 'غير محدد',
                    image: item.product_image || productData.image || '/images/product-default.png',
                    sku: productData.sku,
                    slug: productData.slug
                  }
                };
              }),
              status_history: statusHistory || []
            };
          }));
        } else {
          console.log('⚠️ لم يتم العثور على طلبات في قاعدة البيانات');
          isFromLocalStorage = true;
        }
      } catch (dbError) {
        console.error('❌ خطأ في البحث في قاعدة البيانات:', dbError);
        isFromLocalStorage = true;
      }
    } else {
      console.log('⚠️ Supabase غير متوفر');
      isFromLocalStorage = true;
    }
    
    // البحث في التخزين المحلي إذا فشلت قاعدة البيانات
    if (isFromLocalStorage) {
      console.log('💾 البحث في التخزين المحلي...');
      const localOrders = loadLocalOrders();
      const filteredLocalOrders = localOrders.filter((order: any) => {
        return order.order_number === orderNumber;
      });
      
      if (filteredLocalOrders.length > 0) {
        console.log(`✅ تم العثور على ${filteredLocalOrders.length} طلب في التخزين المحلي`);
        
        // تحويل البيانات المحلية للتنسيق المطلوب
        orders = filteredLocalOrders.map((order: any) => {
          const statusMap: { [key: string]: string } = {
            'pending': 'قيد الانتظار',
            'confirmed': 'مؤكد',
            'shipped': 'تم الشحن',
            'delivered': 'تم التسليم',
            'replacement_requested': 'طلب استبدال',
            'replaced': 'تم الاستبدال',
            'returned': 'تم الإرجاع',
            'cancelled': 'ملغي'
          };

          const paymentMethodMap: { [key: string]: string } = {
            'cash_on_delivery': 'دفع عند الاستلام',
            'cash': 'دفع عند الاستلام',
            'card': 'بطاقة ائتمان',
            'bank_transfer': 'تحويل بنكي',
            'mobile_wallet': 'محفظة إلكترونية'
          };

          return {
            id: order.id,
            order_number: order.order_number || order.id.substring(0, 8).toUpperCase(),
            customer_name: order.customer_name || 'غير محدد',
            customer_phone: order.customer_phone,
            address: order.address,
            governorate: order.governorate,
            shipping_address: order.address || `${order.customer_name}\n${order.address}\nهاتف: ${order.customer_phone}`,
            status: order.status || 'pending',
            status_arabic: statusMap[order.status] || 'قيد الانتظار',
            total: order.total || 0,
            total_amount: order.total || 0,
            shipping_cost: order.shipping_cost || 0,
            tax_amount: order.tax_amount || 0,
            discount_amount: order.discount_amount || 0,
            payment_method: paymentMethodMap[order.payment_method] || order.payment_method || 'غير محدد',
            payment_status: order.payment_status || 'pending',
            shipping_company: order.shipping_company,
            shipping_method: order.shipping_method || 'standard',
            estimated_delivery: order.estimated_delivery,
            customer_notes: order.customer_notes,
            admin_notes: order.admin_notes,
            created_at: order.created_at,
            updated_at: order.updated_at || order.created_at,
            shipped_at: order.shipped_at,
            completed_at: order.completed_at,
            items_count: order.items?.length || 0,
            order_items: order.items?.map((item: any) => ({
              id: `${order.id}-${item.product_id}`,
              product_name: item.product_name || `منتج ${item.product_id}`,
              product_image: item.product_image || '/images/product-default.png',
              selected_color: item.selected_color || null,
              quantity: item.quantity,
              price: item.price,
              unit_price: item.price,
              total_price: item.price * item.quantity,
              product_sku: item.product_sku,
              product_slug: item.product_slug,
              product: {
                name: item.product_name || `منتج ${item.product_id}`,
                image: item.product_image || '/images/product-default.png',
                sku: item.product_sku,
                slug: item.product_slug
              }
            })) || [],
            status_history: []
          };
        });
      }
    }
    
    if (!orders || orders.length === 0) {
      console.log('❌ لم يتم العثور على طلبات');
      return NextResponse.json(
        { 
          success: false,
          message: `لم يتم العثور على طلبات مرتبطة برقم الطلب هذا`,
          search_value: searchValue,
          search_type: searchType,
          orders_count: 0,
          orders: [],
          source: isFromLocalStorage ? 'local_storage' : 'database'
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ تم إرجاع ${orders.length} طلب للعميل`);
    
    return NextResponse.json({
      success: true,
      search_value: searchValue,
      search_type: searchType,
      orders_count: orders.length,
      orders: orders,
      source: isFromLocalStorage ? 'local_storage' : 'database'
    });
    
  } catch (error) {
    console.error('❌ خطأ في تتبع الطلبات:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'حدث خطأ أثناء تتبع الطلبات',
        message: 'حدث خطأ أثناء تتبع الطلبات'
      },
      { status: 500 }
    );
  }
} 