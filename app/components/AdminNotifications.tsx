"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { useSupabaseRealtime } from "@/lib/hooks/useSupabaseRealtime";
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUnreadCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // جلب الإشعارات من API
  const fetchNotifications = () => {
    fetch("/api/notifications?limit=10")
      .then(async (res) => {
        let data = { notifications: [] };
        try {
          const text = await res.text();
          data = text ? JSON.parse(text) : { notifications: [] };
        } catch (e) {
          data = { notifications: [] };
        }
        setNotifications(data.notifications || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // دعم التحديث الفوري realtime
  useSupabaseRealtime({
    table: "notifications",
    event: "*",
    onChange: () => {
      fetchNotifications();
    },
  });

  // تشغيل صوت عند وصول إشعار جديد غير مقروء
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    if (unreadCount > prevUnreadCount.current && audioRef.current) {
      // محاولة تشغيل الصوت مع معالجة الخطأ
      audioRef.current.play().catch(error => {
        // تجاهل الخطأ بصمت - المتصفح يمنع التشغيل التلقائي
        console.log('Audio play failed: User interaction required');
      });
    }
    prevUnreadCount.current = unreadCount;
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifications();
    } catch (err) {}
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (err) {}
  };

  // خريطة تربط كل نوع إشعار بأيقونة ولون Tailwind
  const typeStyleMap: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    order: { icon: Activity, color: 'bg-blue-50 text-blue-700', label: 'طلب جديد' },
    review: { icon: CheckCircle, color: 'bg-green-50 text-green-700', label: 'تقييم جديد' },
    alert: { icon: AlertTriangle, color: 'bg-red-50 text-red-700', label: 'تنبيه' },
    success: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700', label: 'نجاح' },
    info: { icon: Info, color: 'bg-gray-50 text-gray-700', label: 'معلومة' },
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      <Menu.Button className="relative focus:outline-none group">
        <Bell className="h-6 w-6 text-gray-500 group-hover:text-primary transition" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 border-2 border-white shadow">{unreadCount}</span>
        )}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute left-4 z-50 mt-2 w-96 max-w-[95vw] origin-top-left rounded-xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none border border-gray-100"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
            <span className="font-bold text-gray-800 text-base">الإشعارات</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                title="تعليم كل الإشعارات كمقروءة"
              >
                <Check className="w-4 h-4" /> تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 text-center text-gray-400">جاري تحميل الإشعارات...</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                <Bell className="w-10 h-10 mb-2" />
                <span>لا توجد إشعارات جديدة</span>
              </div>
            ) : (
              <>
                {notifications.map((n) => {
                  const style = typeStyleMap[n.type] || typeStyleMap.info;
                  const Icon = style.icon;
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex flex-col gap-0.5 transition-colors duration-200 ${n.is_read ? 'bg-gray-50' : style.color}`}
                      tabIndex={0}
                      role="menuitem"
                      aria-label={`إشعار: ${style.label}`}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && !n.is_read) handleMarkAsRead(n.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${n.is_read ? 'bg-gray-300' : 'bg-primary animate-pulse'}`}></span>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                        <span className="font-semibold text-sm text-gray-700">{n.title || style.label}</span>
                        <span className="sr-only">{n.message}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{n.message}</div>
                      <div className="text-[10px] text-gray-400 rtl:text-left ltr:text-right">
                        {new Date(n.created_at).toLocaleString("ar-EG")}
                      </div>
                    </div>
                  );
                })}
                {/* زر تعليم الكل كمقروء */}
                <div className="p-2 border-t border-gray-100 bg-gray-50 text-center flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      await fetch('/api/notifications/mark-read', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ all: true })
                      });
                      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                    }}
                    className="inline-flex items-center justify-center gap-1 text-primary font-semibold text-sm px-4 py-2 rounded hover:bg-primary/10 transition disabled:opacity-60"
                    disabled={notifications.length === 0 || notifications.every(n => n.is_read)}
                    aria-label="تعليم كل الإشعارات كمقروءة"
                  >
                    <Check className="w-4 h-4" /> تعليم الكل كمقروء
                  </button>
                  <Link
                    href="/dashboard/notifications"
                    className="inline-block text-primary font-semibold text-sm px-4 py-2 rounded hover:bg-primary/10 transition"
                  >
                    عرض كل الإشعارات
                  </Link>
                </div>
              </>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 