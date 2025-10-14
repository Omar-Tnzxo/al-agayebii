-- اختبار سريع للقسم المحدد
-- Section ID: f0d3d741-a0da-450d-8ab5-f527d4016b62

-- 1. معلومات القسم
SELECT 
  id, 
  title, 
  subtitle,
  section_type,
  is_active,
  settings
FROM homepage_sections 
WHERE id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62';

-- 2. المنتجات المرتبطة بالقسم
SELECT 
  hsp.id as link_id,
  hsp.sort_order,
  hsp.product_id,
  p.name,
  p.price,
  p.image,
  p.stock_quantity,
  p.is_active
FROM homepage_section_products hsp
LEFT JOIN products p ON hsp.product_id = p.id
WHERE hsp.section_id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62'
ORDER BY hsp.sort_order;

-- 3. عدد المنتجات
SELECT COUNT(*) as product_count
FROM homepage_section_products
WHERE section_id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62';

-- 4. إذا كان القسم فارغاً، أضف منتجات
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM homepage_section_products 
    WHERE section_id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62'
  ) THEN
    -- أضف أول 5 منتجات مفعّلة
    INSERT INTO homepage_section_products (section_id, product_id, sort_order)
    SELECT 
      'f0d3d741-a0da-450d-8ab5-f527d4016b62',
      id,
      ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1
    FROM products 
    WHERE is_active = true 
    LIMIT 5;
    
    RAISE NOTICE 'تم إضافة % منتجات للقسم', 
      (SELECT COUNT(*) FROM homepage_section_products 
       WHERE section_id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62');
  ELSE
    RAISE NOTICE 'القسم يحتوي بالفعل على % منتجات',
      (SELECT COUNT(*) FROM homepage_section_products 
       WHERE section_id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62');
  END IF;
END $$;

-- 5. التحقق النهائي
SELECT 
  'القسم' as info,
  (SELECT title FROM homepage_sections WHERE id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62') as title,
  (SELECT COUNT(*) FROM homepage_section_products WHERE section_id = 'f0d3d741-a0da-450d-8ab5-f527d4016b62') as products_count;
