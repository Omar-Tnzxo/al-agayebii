-- ===================================
-- فحص جدول التصنيفات والصور
-- ===================================

-- 1. التحقق من schema الجدول وأن عمود image موجود
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'categories'
ORDER BY ordinal_position;

-- 2. عرض جميع التصنيفات مع الصور
SELECT 
  id,
  name,
  type,
  CASE 
    WHEN image IS NULL THEN '❌ NULL'
    WHEN image = '' THEN '❌ Empty String'
    ELSE '✅ ' || LEFT(image, 50) || '...'
  END as image_status,
  image,
  is_active,
  created_at,
  updated_at
FROM categories
ORDER BY created_at DESC;

-- 3. إحصائيات الصور في التصنيفات
SELECT 
  COUNT(*) as total_categories,
  COUNT(image) as categories_with_image,
  COUNT(*) - COUNT(image) as categories_without_image,
  ROUND(100.0 * COUNT(image) / COUNT(*), 2) as percentage_with_images
FROM categories;

-- 4. التصنيفات بدون صور
SELECT 
  id,
  name,
  type,
  created_at,
  updated_at
FROM categories
WHERE image IS NULL OR image = ''
ORDER BY created_at DESC;

-- 5. التصنيفات مع صور
SELECT 
  id,
  name,
  type,
  image,
  created_at,
  updated_at
FROM categories
WHERE image IS NOT NULL AND image != ''
ORDER BY created_at DESC;

-- 6. آخر 5 تعديلات على التصنيفات
SELECT 
  id,
  name,
  type,
  CASE 
    WHEN image IS NULL THEN '❌ NULL'
    WHEN image = '' THEN '❌ Empty'
    ELSE '✅ Has Image'
  END as image_status,
  updated_at
FROM categories
ORDER BY updated_at DESC
LIMIT 5;
