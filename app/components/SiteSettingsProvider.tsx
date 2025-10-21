'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface SiteSettingsContextValue {
  settings: Record<string, string>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(undefined);

interface SiteSettingsProviderProps {
  initialSettings: Record<string, string>;
  children: React.ReactNode;
}

export function SiteSettingsProvider({ initialSettings, children }: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const refreshInProgressRef = useRef(false);

  // دالة لتحديث الإعدادات من الخادم مع منع الطلبات المتكررة
  const refreshSettings = async () => {
    // منع الطلبات المتزامنة
    if (refreshInProgressRef.current || isLoading) {
      return;
    }

    refreshInProgressRef.current = true;
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/settings', {
        cache: 'no-cache',
        // إضافة مهلة زمنية
        signal: AbortSignal.timeout(5000)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      }
    } catch (error) {
      // تجاهل أخطاء timeout والشبكة بصمت
      if (process.env.NODE_ENV === 'development') {
        console.warn('تحذير: فشل تحديث الإعدادات:', error);
      }
    } finally {
      setIsLoading(false);
      refreshInProgressRef.current = false;
    }
  };

  // تحديث الإعدادات كل 10 دقائق (بدلاً من 5 للتقليل من الطلبات)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSettings();
    }, 10 * 60 * 1000); // 10 دقائق

    return () => clearInterval(interval);
  }, []); // تشغيل مرة واحدة فقط

  return (
    <SiteSettingsContext.Provider value={{ settings, setSettings, refreshSettings, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettingsContextValue {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}