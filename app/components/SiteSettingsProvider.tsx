'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // دالة لتحديث الإعدادات من الخادم
  const refreshSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      } else {
        console.warn('لم يتم استلام إعدادات صحيحة من الخادم:', json);
      }
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
      // عدم تغيير الإعدادات الحالية في حالة الخطأ
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث الإعدادات كل 5 دقائق للتزامن
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSettings();
    }, 5 * 60 * 1000); // 5 دقائق

    return () => clearInterval(interval);
  }, []);

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