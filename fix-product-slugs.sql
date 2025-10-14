-- التحقق من وجود slug للمنتجات

-- 1. عرض المنتجات مع slugs
SELECT id, name, slug, is_active
FROM products
WHERE is_active = true
LIMIT 10;

-- 2. التحقق من المنتجات بدون slug
SELECT COUNT(*) as products_without_slug
FROM products
WHERE slug IS NULL OR slug = '';

-- 3. إنشاء slugs تلقائية للمنتجات التي ليس لها slug
UPDATE products
SET slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
)) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- 4. التحقق من النتيجة
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE slug IS NOT NULL AND slug != '') as products_with_slug
FROM products;
