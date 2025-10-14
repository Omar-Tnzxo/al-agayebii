-- ===================================
-- فحص شامل للمنتجات والتصنيفات
-- ===================================

-- 1. هل يوجد منتجات أصلاً؟
SELECT 
  '🔍 إجمالي المنتجات' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ لا توجد أي منتجات!'
    ELSE '✅ يوجد منتجات'
  END as status
FROM products;

-- 2. عرض جميع المنتجات مع تفاصيلها
SELECT 
  p.id,
  p.name,
  p.category_id,
  p.category_type,
  c.id as category_real_id,
  c.name as category_name,
  c.type as category_real_type,
  p.is_active,
  CASE 
    WHEN p.category_id IS NULL THEN '❌ بدون category_id'
    WHEN c.id IS NULL THEN '❌ category_id خاطئ'
    WHEN p.category_type IS NULL THEN '⚠️ category_type فارغ'
    WHEN p.category_type != c.type THEN '⚠️ category_type مختلف'
    ELSE '✅ صحيح'
  END as status
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
ORDER BY p.created_at DESC;

-- 3. عدد المنتجات حسب الحالة
SELECT 
  '📊 توزيع المنتجات' as info,
  COUNT(*) as total,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as without_category_id,
  COUNT(CASE WHEN category_type IS NULL THEN 1 END) as without_category_type,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
FROM products;

-- 4. عرض التصنيفات
SELECT 
  '📁 التصنيفات الموجودة' as info,
  id,
  name,
  type,
  is_active
FROM categories
ORDER BY name;
