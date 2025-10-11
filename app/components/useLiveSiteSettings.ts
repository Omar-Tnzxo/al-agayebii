// useLiveSiteSettings.ts
'use client';

import { useEffect, useState } from 'react';

export function useLiveSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success) setSettings(json.data);
      } catch {
        setSettings({});
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return { settings, loading };
} 