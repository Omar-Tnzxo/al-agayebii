import { createClient } from '@supabase/supabase-js';

export interface SiteSettings {
  [key: string]: string;
}

/**
 * جلب إعدادات الموقع من جدول site_settings
 * هذه الدالة تعمل فقط على جانب الخادم.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[getSiteSettings] Supabase credentials are missing');
    return {};
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('site_settings')
      .select('key,value');

    if (error) {
      console.error('[getSiteSettings] Error fetching settings:', error.message);
      return {};
    }

    const settings: SiteSettings = {};
    data?.forEach(({ key, value }) => {
      settings[key] = value;
    });

    return settings;
  } catch (err) {
    console.error('[getSiteSettings] Unexpected error:', err);
    return {};
  }
} 