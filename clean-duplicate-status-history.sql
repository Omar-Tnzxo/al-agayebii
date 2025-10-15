-- ============================================
-- تنظيف السجلات المكررة في order_status_history
-- ============================================

-- 1. عرض السجلات المكررة قبل الحذف
SELECT 
  order_id,
  old_status,
  new_status,
  DATE_TRUNC('second', created_at) as time_group,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
FROM order_status_history
GROUP BY order_id, old_status, new_status, DATE_TRUNC('second', created_at)
HAVING COUNT(*) > 1
ORDER BY created_at DESC;

-- 2. حذف السجلات المكررة (الاحتفاظ بواحد فقط لكل مجموعة)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        order_id, 
        old_status, 
        new_status, 
        DATE_TRUNC('second', created_at)
      ORDER BY 
        CASE 
          WHEN changed_by = 'مدير النظام' THEN 1
          ELSE 2
        END,
        created_at DESC,
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

-- 3. عرض النتيجة النهائية
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT order_id) as unique_orders
FROM order_status_history;

-- 4. عرض آخر 20 سجل
SELECT 
  order_id,
  old_status,
  new_status,
  changed_by,
  notes,
  created_at
FROM order_status_history
ORDER BY created_at DESC
LIMIT 20;

