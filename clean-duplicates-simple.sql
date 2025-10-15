-- ============================================
-- تنظيف السجلات المكررة - نسخة مبسطة
-- ============================================

-- الخطوة 1: عرض السجلات المكررة فقط
SELECT 
  order_id,
  old_status,
  new_status,
  DATE_TRUNC('second', created_at) as time_group,
  COUNT(*) as count
FROM order_status_history
GROUP BY order_id, old_status, new_status, DATE_TRUNC('second', created_at)
HAVING COUNT(*) > 1
ORDER BY time_group DESC;

-- الخطوة 2: حذف السجلات المكررة
-- سيتم الاحتفاظ بالسجل الذي له changed_by = 'مدير النظام' أو الأحدث
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
          WHEN changed_by IS NOT NULL AND changed_by != '' THEN 1
          ELSE 2
        END,
        created_at DESC
    ) as rn
  FROM order_status_history
)
DELETE FROM order_status_history
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- الخطوة 3: التحقق من النتيجة
SELECT 
  'تم الحذف بنجاح' as message,
  COUNT(*) as total_remaining_records
FROM order_status_history;
