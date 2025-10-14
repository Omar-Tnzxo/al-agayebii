-- التحقق من الأقسام في قاعدة البيانات

-- 1. عرض جميع الأقسام
SELECT 
  id,
  title,
  section_type,
  is_active,
  settings->>'product_source' as product_source
FROM homepage_sections
ORDER BY sort_order;

-- 2. عرض الأقسام اليدوية النشطة فقط
SELECT 
  id,
  title,
  section_type,
  is_active,
  settings
FROM homepage_sections
WHERE is_active = true
  AND section_type = 'products'
  AND settings->>'product_source' = 'manual'
ORDER BY sort_order;

-- 3. إحصائيات الأقسام
SELECT 
  section_type,
  settings->>'product_source' as product_source,
  is_active,
  COUNT(*) as count
FROM homepage_sections
GROUP BY section_type, settings->>'product_source', is_active;

-- 4. إذا لم توجد أقسام يدوية، أنشئ قسم تجريبي
INSERT INTO homepage_sections (
  title,
  subtitle,
  section_type,
  settings,
  is_active,
  sort_order
)
SELECT 
  'مختارات الأسبوع',
  'منتجات مختارة بعناية',
  'products',
  '{"product_source": "manual", "product_count": 8, "layout": "grid", "columns": 4, "show_view_all": true}'::jsonb,
  true,
  (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM homepage_sections)
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_sections 
  WHERE settings->>'product_source' = 'manual'
);
