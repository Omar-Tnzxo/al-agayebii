-- ===================================
-- إصلاح category_type للمنتجات
-- ===================================

-- 1. أولاً: تحقق من المشكلة - عرض المنتجات التي لها category_id لكن بدون category_type
SELECT 
  p.id,
  p.name,
  p.category_id,
  p.category_type,
  c.type as should_be_category_type,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.category_id IS NOT NULL 
  AND (p.category_type IS NULL OR p.category_type = '' OR p.category_type != c.type)
ORDER BY p.created_at DESC;

-- 2. إصلاح المنتجات الموجودة: تحديث category_type من category_id
UPDATE products p
SET category_type = c.type
FROM categories c
WHERE p.category_id = c.id
  AND (p.category_type IS NULL OR p.category_type = '' OR p.category_type != c.type);

-- 3. عرض النتيجة بعد الإصلاح
SELECT 
  p.id,
  p.name,
  p.category_id,
  p.category_type,
  c.type as category_type_from_join,
  c.name as category_name,
  CASE 
    WHEN p.category_type = c.type THEN '✅ صحيح'
    ELSE '❌ خطأ'
  END as status
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.category_id IS NOT NULL
ORDER BY status, p.created_at DESC;

-- 4. إنشاء Trigger لتحديث category_type تلقائياً عند إضافة/تعديل منتج
CREATE OR REPLACE FUNCTION sync_product_category_type()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تعيين category_id، قم بتحديث category_type تلقائياً
  IF NEW.category_id IS NOT NULL THEN
    SELECT type INTO NEW.category_type
    FROM categories
    WHERE id = NEW.category_id;
  ELSE
    -- إذا لم يكن هناك category_id، اجعل category_type NULL
    NEW.category_type := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف Trigger القديم إن وجد
DROP TRIGGER IF EXISTS trigger_sync_product_category_type ON products;

-- إنشاء Trigger جديد
CREATE TRIGGER trigger_sync_product_category_type
  BEFORE INSERT OR UPDATE OF category_id ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_category_type();

-- 5. اختبار: عرض عدد المنتجات لكل تصنيف
SELECT 
  c.name as category_name,
  c.type as category_type,
  COUNT(p.id) as product_count_by_id,
  COUNT(CASE WHEN p.category_type = c.type THEN 1 END) as product_count_by_type
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name, c.type
ORDER BY c.name;

-- 6. رسالة نجاح
DO $$
BEGIN
  RAISE NOTICE '✅ تم إصلاح category_type لجميع المنتجات';
  RAISE NOTICE '✅ تم إنشاء Trigger لتحديث category_type تلقائياً';
  RAISE NOTICE '📊 راجع النتائج أعلاه للتأكد';
END $$;
