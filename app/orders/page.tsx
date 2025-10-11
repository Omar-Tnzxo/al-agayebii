'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TruckIcon, 
  Eye, 
  Timer 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showErrorToast } from '@/lib/utils/show-error-toast';

// حالات الطلبات
const ORDER_STATUS = {
  'pending': { 
    name: 'قيد الانتظار', 
    color: 'bg-amber-100 text-amber-800', 
    icon: Clock 
  },
  'processing': {
    name: 'قيد المعالجة',
    color: 'bg-blue-100 text-blue-800',
    icon: Timer
  },
  'shipped': {
    name: 'تم الشحن',
    color: 'bg-indigo-100 text-indigo-800',
    icon: TruckIcon
  },
  'completed': {
    name: 'مكتمل',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  'canceled': {
    name: 'ملغي',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
};

// نموذج الطلب
interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: keyof typeof ORDER_STATUS;
  items_count: number;
  created_at: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // جلب طلبات المستخدم
  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        // تحقق من بيانات المستخدم (يمكن استبدالها بنظام المصادقة الفعلي)
        const userPhone = localStorage.getItem('user_phone');
        
        if (!userPhone) {
          setError('يرجى تسجيل الدخول أولاً لعرض طلباتك');
          setLoading(false);
          return;
        }
        
        // جلب طلبات المستخدم من قاعدة البيانات
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_phone', userPhone)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setOrders(data || []);
      } catch (err: any) {
        console.error('خطأ في جلب الطلبات:', err);
        setError(err.message || 'حدث خطأ أثناء جلب الطلبات');
        showErrorToast("تعذر جلب طلباتك. يرجى المحاولة مرة أخرى لاحقًا.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserOrders();
  }, []);
  
  // تنسيق السعر بالجنيه المصري
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">طلباتي</h1>
        <p className="text-gray-600">تابع حالة طلباتك السابقة</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">لا توجد طلبات حالية</h2>
          <p className="text-gray-600 mb-6">لم تقم بإضافة أي طلبات بعد</p>
          <button
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => router.push('/products')}
          >
            تصفح المنتجات
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const StatusIcon = ORDER_STATUS[order.status].icon;
            return (
              <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 sm:p-4 md:p-6 flex flex-col sm:flex-row justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm text-gray-500">رقم الطلب:</p>
                      <p className="font-medium">{order.id.substring(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm text-gray-500">تاريخ الطلب:</p>
                      <p>{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500">المجموع:</p>
                      <p className="font-bold">{formatPrice(order.total)} جنيه</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end justify-between">
                    <div className={`px-3 py-1 rounded-full flex items-center gap-1 ${ORDER_STATUS[order.status].color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{ORDER_STATUS[order.status].name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{order.items_count} منتج</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-6 py-3 flex justify-end">
                  <button
                    className="text-primary hover:text-primary/90 flex items-center gap-1"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>عرض التفاصيل</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 