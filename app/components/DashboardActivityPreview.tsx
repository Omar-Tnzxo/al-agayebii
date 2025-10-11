"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle, Info, Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeIcon = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertTriangle,
  order: Activity,
  promotion: Bell,
};

export default function DashboardActivityPreview() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?limit=5")
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
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> آخر الأنشطة
        </h2>
        <Link
          href="/dashboard/activity"
          className="text-primary text-sm font-medium hover:underline"
        >
          عرض الكل
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="p-4 text-center text-gray-400">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-400">لا توجد أنشطة حديثة</div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcon[n.type as keyof typeof typeIcon] || Info;
            return (
              <div
                key={n.id}
                className={`py-3 flex items-start gap-3 ${n.is_read ? "bg-gray-50" : "bg-yellow-50"}`}
              >
                {Icon ? <Icon className="w-5 h-5 text-primary" /> : <Info className="w-5 h-5 text-primary" />}
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-700">{n.title}</div>
                  <div className="text-xs text-gray-600 mb-1 line-clamp-2">{n.message}</div>
                  <div className="text-[10px] text-gray-400 rtl:text-left ltr:text-right">
                    {new Date(n.created_at).toLocaleString("en-US")}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 