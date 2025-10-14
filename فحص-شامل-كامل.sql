-- ═══════════════════════════════════════════════════════════════
-- فحص شامل كامل للمنتجات والتصنيفات
-- ═══════════════════════════════════════════════════════════════
-- انسخ هذا السكريبت بالكامل والصقه في Supabase SQL Editor واضغط Run
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ هل يوجد منتجات أصلاً؟
SELECT 
  '1️⃣ إجمالي المنتجات' as "الفحص",
  COUNT(*) as "العدد",
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ لا توجد أي منتجات في قاعدة البيانات!'
    ELSE '✅ يوجد ' || COUNT(*) || ' منتج في قاعدة البيانات'
  END as "الحالة"
FROM products;

-- ═══════════════════════════════════════════════════════════════

-- 2️⃣ تفاصيل جميع المنتجات مع حالة كل منتج
SELECT 
  '2️⃣ تفاصيل المنتجات' as "القسم",
  p.name as "اسم المنتج",
  p.category_id as "معرف التصنيف المحفوظ",
  p.category_type as "نوع التصنيف المحفوظ",
  c.id as "معرف التصنيف الحقيقي",
  c.name as "اسم التصنيف",
  c.type as "نوع التصنيف الحقيقي",
  p.is_active as "المنتج مفعل؟",
  CASE 
    WHEN p.category_id IS NULL THEN '❌ المنتج بدون category_id - يجب تحديد تصنيف'
    WHEN c.id IS NULL THEN '❌ category_id خاطئ - لا يطابق أي تصنيف موجود'
    WHEN p.category_type IS NULL THEN '⚠️ category_type فارغ - يحتاج تحديث'
    WHEN p.category_type != c.type THEN '⚠️ category_type مختلف عن التصنيف الحقيقي'
    ELSE '✅ كل شيء صحيح'
  END as "الحالة والمشكلة"
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
ORDER BY p.created_at DESC;

-- ═══════════════════════════════════════════════════════════════

-- 3️⃣ إحصائيات وتوزيع المنتجات
SELECT 
  '3️⃣ إحصائيات المنتجات' as "القسم",
  COUNT(*) as "إجمالي المنتجات",
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as "منتجات بدون category_id",
  COUNT(CASE WHEN category_type IS NULL THEN 1 END) as "منتجات بدون category_type",
  COUNT(CASE WHEN is_active = true THEN 1 END) as "منتجات مفعلة",
  COUNT(CASE WHEN is_active = false THEN 1 END) as "منتجات غير مفعلة"
FROM products;

-- ═══════════════════════════════════════════════════════════════

-- 4️⃣ التصنيفات الموجودة
SELECT 
  '4️⃣ التصنيفات الموجودة' as "القسم",
  id as "المعرف",
  name as "الاسم",
  type as "النوع",
  is_active as "مفعل؟"
FROM categories
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════

-- 5️⃣ عدد المنتجات لكل تصنيف (حسب category_id)
SELECT 
  '5️⃣ المنتجات حسب التصنيف (category_id)' as "القسم",
  c.name as "اسم التصنيف",
  c.type as "نوع التصنيف",
  COUNT(p.id) as "عدد المنتجات المرتبطة",
  STRING_AGG(p.name, ', ') as "أسماء المنتجات"
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.type
ORDER BY c.name;

-- ═══════════════════════════════════════════════════════════════

-- 6️⃣ عدد المنتجات لكل تصنيف (حسب category_type)
SELECT 
  '6️⃣ المنتجات حسب التصنيف (category_type)' as "القسم",
  c.name as "اسم التصنيف",
  c.type as "نوع التصنيف",
  COUNT(p.id) as "عدد المنتجات المرتبطة",
  STRING_AGG(p.name, ', ') as "أسماء المنتجات"
FROM categories c
LEFT JOIN products p ON p.category_type = c.type
GROUP BY c.id, c.name, c.type
ORDER BY c.name;

-- ═══════════════════════════════════════════════════════════════

-- 7️⃣ ملخص نهائي وتشخيص
SELECT 
  '7️⃣ التشخيص النهائي' as "القسم",
  CASE 
    WHEN (SELECT COUNT(*) FROM products) = 0 THEN 
      '❌ المشكلة: لا توجد أي منتجات في قاعدة البيانات!
الحل: اذهب إلى Dashboard وأضف منتجات جديدة'
    
    WHEN (SELECT COUNT(*) FROM products WHERE category_id IS NULL) > 0 THEN
      '❌ المشكلة: يوجد ' || (SELECT COUNT(*) FROM products WHERE category_id IS NULL) || ' منتج بدون category_id
الحل: عدّل هذه المنتجات من Dashboard واختر التصنيف المناسب'
    
    WHEN (SELECT COUNT(*) FROM products WHERE category_type IS NULL) > 0 THEN
      '⚠️ المشكلة: يوجد ' || (SELECT COUNT(*) FROM products WHERE category_type IS NULL) || ' منتج بدون category_type
الحل: نفذ السكريبت fix-category-type.sql لتحديث category_type تلقائياً'
    
    WHEN (SELECT COUNT(*) FROM products WHERE is_active = false) = (SELECT COUNT(*) FROM products) THEN
      '⚠️ المشكلة: جميع المنتجات غير مفعلة (is_active = false)
الحل: فعّل المنتجات من Dashboard أو نفذ: UPDATE products SET is_active = true;'
    
    ELSE 
      '✅ كل شيء يبدو صحيحاً! إذا لم تظهر المنتجات، تحقق من:
- Cache (أعد تشغيل npm run dev)
- راجع logs في Terminal
- تأكد من أن المنتجات is_active = true'
  END as "التشخيص والحل"
FROM (SELECT 1) as dummy;

-- ═══════════════════════════════════════════════════════════════
-- انتهى الفحص
-- ═══════════════════════════════════════════════════════════════
