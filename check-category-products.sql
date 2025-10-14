-- ===================================
-- فحص المنتجات والتصنيفات
-- ===================================

-- 1. عرض جميع التصنيفات مع عدد المنتجات
SELECT 
  c.id,
  c.name,
  c.type,
  c.is_active,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_type = c.type AND p.is_active = true
GROUP BY c.id, c.name, c.type, c.is_active
ORDER BY c.name;

-- 2. عرض المنتجات حسب التصنيف
SELECT 
  c.type as category_type,
  c.name as category_name,
  p.id,
  p.name as product_name,
  p.category_type,
  p.is_active
FROM categories c
LEFT JOIN products p ON p.category_type = c.type
ORDER BY c.type, p.name;

-- 3. التحقق من المنتجات التي ليس لها تصنيف صحيح
SELECT 
  p.id,
  p.name,
  p.category_type,
  p.is_active,
  CASE 
    WHEN c.type IS NULL THEN '❌ تصنيف غير موجود'
    ELSE '✅ تصنيف موجود'
  END as category_status
FROM products p
LEFT JOIN categories c ON c.type = p.category_type
ORDER BY category_status, p.name;

-- 4. التصنيفات التي ليس لها منتجات
SELECT 
  c.name,
  c.type,
  c.is_active
FROM categories c
LEFT JOIN products p ON p.category_type = c.type AND p.is_active = true
WHERE p.id IS NULL
ORDER BY c.name;

-- 5. التصنيفات التي لها منتجات
SELECT 
  c.name,
  c.type,
  COUNT(p.id) as active_products
FROM categories c
INNER JOIN products p ON p.category_type = c.type AND p.is_active = true
GROUP BY c.name, c.type
ORDER BY active_products DESC;

-- 6. فحص تصنيف معين (غيّر 'electrical' حسب الحاجة)
SELECT 
  'التصنيف' as info_type,
  c.name,
  c.type,
  c.is_active
FROM categories c
WHERE c.type = 'electrical'

UNION ALL

SELECT 
  'المنتجات' as info_type,
  p.name,
  p.category_type,
  p.is_active::text
FROM products p
WHERE p.category_type = 'electrical';
