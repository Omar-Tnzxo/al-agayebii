'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Info, AlertTriangle, CheckCircle, Activity, Check } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeStyleMap: Record<string, { icon: any; color: string; label: string }> = {
  order: { icon: Activity, color: 'bg-blue-50 text-blue-700', label: 'طلب جديد' },
  review: { icon: CheckCircle, color: 'bg-green-50 text-green-700', label: 'تقييم جديد' },
  alert: { icon: AlertTriangle, color: 'bg-red-50 text-red-700', label: 'تنبيه' },
  success: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700', label: 'نجاح' },
  info: { icon: Info, color: 'bg-gray-50 text-gray-700', label: 'معلومة' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const limit = 20;

  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    const res = await fetch(`/api/notifications?page=${pageNum}&limit=${limit}`);
    const data = await res.json();
    setNotifications(data.notifications || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setSuccessMsg('');
    const res = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setSuccessMsg('تم تعليم كل الإشعارات كمقروءة بنجاح');
      setTimeout(() => setSuccessMsg(''), 2500);
    }
    setMarkingAll(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">كل الإشعارات</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-primary">عودة للوحة التحكم</Link>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <button
          className="flex items-center gap-1 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60"
          onClick={handleMarkAllRead}
          disabled={markingAll || notifications.length === 0 || notifications.every(n => n.is_read)}
          aria-label="تعليم كل الإشعارات كمقروءة"
        >
          <Check className="w-4 h-4" />
          تعليم الكل كمقروء
        </button>
        {successMsg && (
          <span className="text-green-600 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> {successMsg}</span>
        )}
      </div>
      <div className="bg-white rounded-xl shadow border divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري تحميل الإشعارات...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Info className="w-10 h-10 mb-2" />
            <span>لا توجد إشعارات</span>
          </div>
        ) : (
          notifications.map((n) => {
            const style = typeStyleMap[n.type] || typeStyleMap.info;
            const Icon = style.icon;
            return (
              <div
                key={n.id}
                className={`flex items-center gap-3 px-6 py-4 ${n.is_read ? 'bg-gray-50' : style.color}`}
                tabIndex={0}
                role="listitem"
                aria-label={`إشعار: ${style.label}`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-700">{n.title || style.label}</div>
                  <div className="text-xs text-gray-600 mb-1">{n.message}</div>
                  <div className="text-[10px] text-gray-400 rtl:text-left ltr:text-right">
                    {new Date(n.created_at).toLocaleString("en-US")}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            السابق
          </button>
          <span className="px-2 py-1 text-sm">صفحة {page} من {Math.ceil(total / limit)}</span>
          <button
            className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page === Math.ceil(total / limit)}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
} 