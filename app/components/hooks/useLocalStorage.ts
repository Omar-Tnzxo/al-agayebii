'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // تحميل القيمة من التخزين المحلي عند التحميل الأولي
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      }
    } catch (error) {
      console.error('خطأ في قراءة التخزين المحلي:', error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      // حفظ القيمة في الحالة المحلية
      setStoredValue(value);
      
      // حفظ القيمة في التخزين المحلي
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('خطأ في حفظ التخزين المحلي:', error);
    }
  };

  return [storedValue, setValue];
} 