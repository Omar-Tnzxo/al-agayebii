-- ============================================
-- تنظيف السجلات المكررة المتبقية
-- ============================================

-- الخطوة 1: عرض السجلات المكررة المتبقية
SELECT 
  order_id,
  old_status,
  new_status,
  changed_by,
  notes,
  created_at
FROM order_status_history
WHERE (order_id, old_status, new_status, DATE_TRUNC('second', created_at)) IN (
  SELECT 
    order_id,
    old_status,
    new_status,
    DATE_TRUNC('second', created_at)
  FROM order_status_history
  GROUP BY order_id, old_status, new_status, DATE_TRUNC('second', created_at)
  HAVING COUNT(*) > 1
)
ORDER BY created_at DESC, order_id, old_status;

-- الخطوة 2: حذف السجلات المكررة المتبقية
-- سيتم الاحتفاظ بالسجل الذي له changed_by (من المستخدم) بدلاً من التلقائي
WITH duplicates AS (
  SELECT 
    id,
    order_id,
    old_status,
    new_status,
    created_at,
    changed_by,
    ROW_NUMBER() OVER (
      PARTITION BY 
        order_id, 
        old_status, 
        new_status, 
        DATE_TRUNC('millisecond', created_at)
      ORDER BY 
        CASE 
          -- الأولوية للسجل الذي له changed_by
          WHEN changed_by IS NOT NULL AND changed_by != '' THEN 1
          ELSE 2
        END,
        id DESC
    ) as rn
  FROM order_status_history
)
DELETE FROM order_status_history
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- الخطوة 3: التحقق من عدم وجود مكررات
SELECT 
  'تم التنظيف بنجاح' as status,
  COUNT(*) as total_records,
  COUNT(DISTINCT order_id) as unique_orders
FROM order_status_history;

-- الخطوة 4: عرض آخر 20 سجل للتأكد
SELECT 
  order_id,
  old_status || ' → ' || new_status as status_change,
  changed_by,
  LEFT(notes, 50) as notes_preview,
  created_at
FROM order_status_history
ORDER BY created_at DESC
LIMIT 20;
