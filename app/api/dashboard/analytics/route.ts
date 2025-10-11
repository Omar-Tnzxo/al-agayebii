import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'all'; // all, today, yesterday, week, month, quarter, 6months

    // حساب التواريخ بناءً على الفترة المحددة
    let filterStartDate: string | null = startDate;
    let filterEndDate: string | null = endDate;

    if (period !== 'all' && period !== 'custom') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (period) {
        case 'today':
          filterStartDate = today.toISOString();
          filterEndDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'yesterday':
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          filterStartDate = yesterday.toISOString();
          filterEndDate = today.toISOString();
          break;
        case 'week':
          const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filterStartDate = weekStart.toISOString();
          filterEndDate = now.toISOString();
          break;
        case 'lastWeek':
          const lastWeekEnd = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
          const lastWeekStart = new Date(lastWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          filterStartDate = lastWeekStart.toISOString();
          filterEndDate = lastWeekEnd.toISOString();
          break;
        case 'month':
          const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filterStartDate = monthStart.toISOString();
          filterEndDate = now.toISOString();
          break;
        case 'lastMonth':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          filterStartDate = lastMonthStart.toISOString();
          filterEndDate = lastMonthEnd.toISOString();
          break;
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          filterStartDate = quarterStart.toISOString();
          filterEndDate = now.toISOString();
          break;
        case 'lastQuarter':
          const lastQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
          const lastQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
          filterStartDate = lastQuarterStart.toISOString();
          filterEndDate = lastQuarterEnd.toISOString();
          break;
        case '6months':
          const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          filterStartDate = sixMonthsStart.toISOString();
          filterEndDate = now.toISOString();
          break;
      }
    }

    // إنشاء الاستعلامات مع فلترة التاريخ
    const createQuery = (table: string, dateFilter = true) => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (dateFilter && filterStartDate && period !== 'all') {
        query = query.gte('created_at', filterStartDate);
        if (filterEndDate) {
          query = query.lte('created_at', filterEndDate);
        }
      }
      return query;
    };

    // الإحصائيات الأساسية - الحالات المصرية الجديدة
    const [
      { count: totalOrders },
      { count: totalProducts },
      { count: totalCategories },
      { count: pendingOrders },
      { count: confirmedOrders },
      { count: shippedOrders },
      { count: deliveredOrders },
      { count: replacementRequestedOrders },
      { count: replacedOrders },
      { count: returnedOrders },
      { count: cancelledOrders }
    ] = await Promise.all([
      createQuery('orders'),
      supabase.from('products').select('*', { count: 'exact', head: true }), // المنتجات بدون فلتر تاريخ
      supabase.from('categories').select('*', { count: 'exact', head: true }), // التصنيفات بدون فلتر تاريخ
      createQuery('orders').eq('status', 'pending'),
      createQuery('orders').eq('status', 'confirmed'),
      createQuery('orders').eq('status', 'shipped'),
      createQuery('orders').eq('status', 'delivered'),
      createQuery('orders').eq('status', 'replacement_requested'),
      createQuery('orders').eq('status', 'replaced'),
      createQuery('orders').eq('status', 'returned'),
      createQuery('orders').eq('status', 'cancelled')
    ]);

    // إحصائيات المبيعات والأرباح مع فلترة التاريخ - للطلبات المكتملة والمسلمة
    let salesQuery = supabase
      .from('orders')
      .select(`
        total,
        shipping_cost,
        created_at,
        status,
        payment_status,
        order_items (
          quantity,
          price,
          products (
            cost_price
          )
        )
      `)
      .in('status', ['delivered', 'replaced']); // الطلبات المسلمة أو المستبدلة تعتبر مكتملة

    // تطبيق فلترة التاريخ على المبيعات
    if (filterStartDate && period !== 'all') {
      salesQuery = salesQuery.gte('created_at', filterStartDate);
      if (filterEndDate) {
        salesQuery = salesQuery.lte('created_at', filterEndDate);
      }
    }

    const { data: salesData } = await salesQuery;

    // حساب المبيعات الإجمالية والأرباح
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const monthlySales: { [key: string]: number } = {};
    const monthlyProfit: { [key: string]: number } = {};

    salesData?.forEach(order => {
      const orderTotal = Number(order.total) || 0;
      const shippingCost = Number(order.shipping_cost) || 0;
      totalRevenue += orderTotal;

      // حساب تكلفة الطلب
      let orderCost = 0;
      if (order.order_items) {
        orderCost = order.order_items.reduce((sum, item) => {
          const costPrice = (item.products && typeof item.products === 'object' && 'cost_price' in item.products) ? Number(item.products.cost_price) || 0 : 0;
          return sum + (costPrice * item.quantity);
        }, 0);
      }

      totalCost += orderCost + shippingCost;
      const orderProfit = orderTotal - orderCost - shippingCost;
      totalProfit += orderProfit;

      // تجميع البيانات الشهرية
      const month = new Date(order.created_at).toISOString().slice(0, 7); // YYYY-MM
      monthlySales[month] = (monthlySales[month] || 0) + orderTotal;
      monthlyProfit[month] = (monthlyProfit[month] || 0) + orderProfit;
    });

    // أحدث الطلبات مع فلترة التاريخ
    let recentOrdersQuery = supabase
      .from('orders')
      .select('id, order_number, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // تطبيق فلترة التاريخ على الطلبات الحديثة
    if (filterStartDate && period !== 'all') {
      recentOrdersQuery = recentOrdersQuery.gte('created_at', filterStartDate);
      if (filterEndDate) {
        recentOrdersQuery = recentOrdersQuery.lte('created_at', filterEndDate);
      }
    }

    const { data: recentOrders } = await recentOrdersQuery;

    // أكثر المنتجات مبيعاً مع فلترة التاريخ
    let topProductsQuery = supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        order_id,
        products (
          name,
          image,
          price
        ),
        orders!inner (
          created_at,
          status
        )
      `)
      .in('orders.status', ['delivered', 'replaced']);

    // تطبيق فلترة التاريخ على المنتجات
    if (filterStartDate && period !== 'all') {
      topProductsQuery = topProductsQuery.gte('orders.created_at', filterStartDate);
      if (filterEndDate) {
        topProductsQuery = topProductsQuery.lte('orders.created_at', filterEndDate);
      }
    }

    const { data: topProducts } = await topProductsQuery;

    // تجميع المنتجات الأكثر مبيعاً
    const productSales: { [key: string]: any } = {};
    topProducts?.forEach((item: any) => {
      if (productSales[item.product_id]) {
        productSales[item.product_id].totalQuantity += item.quantity;
        productSales[item.product_id].totalRevenue += item.quantity * (productSales[item.product_id].price || 0);
      } else {
        productSales[item.product_id] = {
          id: item.product_id,
          name: item.product_name || (item.products && Array.isArray(item.products) ? item.products[0]?.name : item.products?.name),
          image: item.products && Array.isArray(item.products) ? item.products[0]?.image : item.products?.image,
          price: item.products && Array.isArray(item.products) ? item.products[0]?.price : item.products?.price,
          totalQuantity: item.quantity,
          totalRevenue: item.quantity * (item.products && Array.isArray(item.products) ? item.products[0]?.price || 0 : item.products?.price || 0)
        };
      }
    });

    const topSellingProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // إحصائيات الإشعارات
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    // معدل التحويل (نسبة الطلبات المسلمة من إجمالي الطلبات)
    const completedOrdersCount = (deliveredOrders || 0) + (replacedOrders || 0);
    const conversionRate = (totalOrders || 0) > 0 ? (completedOrdersCount / (totalOrders || 1) * 100) : 0;

    // متوسط قيمة الطلب
    const averageOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;

    // نمو المبيعات الشهري (مقارنة بالشهر الماضي)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    const currentMonthSales = monthlySales[currentMonth] || 0;
    const lastMonthSales = monthlySales[lastMonth] || 0;
    const salesGrowth = lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales * 100) : 0;

    // إحصائيات السوق المصري المتقدمة

    // معدل التسليم الناجح: الطلبات المسلمة مقابل المشحونة
    const totalShippedOrders = (shippedOrders || 0) + (deliveredOrders || 0) + (returnedOrders || 0);
    const deliverySuccessRate = totalShippedOrders > 0 ? ((deliveredOrders || 0) / totalShippedOrders * 100) : 0;

    // معدل الإرجاع: الطلبات المرتجعة من إجمالي المشحونة
    const returnRate = totalShippedOrders > 0 ? ((returnedOrders || 0) / totalShippedOrders * 100) : 0;

    // معدل الاستبدال: الطلبات المستبدلة من إجمالي المسلمة
    const totalDeliveredOrders = (deliveredOrders || 0) + (replacedOrders || 0);
    const replacementRate = totalDeliveredOrders > 0 ? ((replacementRequestedOrders || 0) + (replacedOrders || 0)) / totalDeliveredOrders * 100 : 0;

    // الآن نحتاج لجلب بيانات الدفع من قاعدة البيانات لحساب معدلات الدفع
    const { data: paymentData } = await supabase
      .from('orders')
      .select('payment_status')
      .not('payment_status', 'is', null);

    const codOrdersCount = paymentData?.filter((order: any) => order.payment_status === 'cash_on_delivery').length || 0;
    const collectedOrdersCount = paymentData?.filter((order: any) => order.payment_status === 'collected').length || 0;
    const totalOrdersWithPayment = paymentData?.length || 1;

    // نسبة الدفع عند الاستلام من إجمالي الطلبات
    const cashOnDeliveryRate = (totalOrdersWithPayment > 0) ? (codOrdersCount / totalOrdersWithPayment * 100) : 0;

    // معدل التحصيل: الطلبات المحصلة من شركة الشحن مقابل المدفوعة عند الاستلام
    const collectionRate = codOrdersCount > 0 ? (collectedOrdersCount / codOrdersCount * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalOrders: totalOrders || 0,
          totalProducts: totalProducts || 0,
          totalCategories: totalCategories || 0,
          totalRevenue,
          totalProfit,
          averageOrderValue,
          conversionRate,
          salesGrowth,
          unreadNotifications: unreadNotifications || 0,
          deliverySuccessRate,
          returnRate,
          replacementRate,
          cashOnDeliveryRate,
          collectionRate
        },
        orderStatus: {
          pending: pendingOrders || 0,
          confirmed: confirmedOrders || 0,
          shipped: shippedOrders || 0,
          delivered: deliveredOrders || 0,
          replacement_requested: replacementRequestedOrders || 0,
          replaced: replacedOrders || 0,
          returned: returnedOrders || 0,
          cancelled: cancelledOrders || 0
        },
        charts: {
          monthlySales: Object.entries(monthlySales)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6), // آخر 6 شهور
          monthlyProfit: Object.entries(monthlyProfit)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
        },
        recentOrders: recentOrders || [],
        topProducts: topSellingProducts,
        // معلومات الفترة الزمنية
        dateRange: {
          period,
          startDate: filterStartDate,
          endDate: filterEndDate,
          isFiltered: period !== 'all'
        }
      }
    });

  } catch (error: any) {
    console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
    return NextResponse.json(
      {
        error: 'خطأ داخلي في الخادم',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}