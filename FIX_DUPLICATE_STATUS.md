# إصلاح مشكلة تكرار حالات الطلبات

## المشكلة
يتم تسجيل تغيير حالة الطلب مرتين في جدول `order_status_history`:
- مرة من الكود في API
- مرة من trigger تلقائي (إذا كان موجوداً)

## الحل

### 1. تنظيف السجلات المكررة الحالية

افتح Supabase Dashboard → SQL Editor وقم بتشغيل الكود من ملف `clean-duplicate-status-history.sql`

أو قم بتشغيل الكود التالي:

```sql
-- حذف السجلات المكررة
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
```

### 2. التحقق من عدم وجود Trigger مكرر

قم بتشغيل الكود من ملف `check-triggers.sql` للتحقق من وجود triggers:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders';
```

إذا وجدت trigger يضيف سجلات في `order_status_history`، قم بحذفه:

```sql
DROP TRIGGER IF EXISTS trigger_name ON orders;
```

### 3. التأكد من الإصلاح

بعد تنفيذ السكريبت:
1. افتح Dashboard → Orders
2. قم بتغيير حالة أي طلب
3. افتح تفاصيل الطلب وانتقل إلى تبويب "تاريخ الحالات"
4. تأكد من ظهور السجل مرة واحدة فقط

## ملاحظات

- تم إزالة الكود المكرر من `app/api/orders/[id]/route.ts`
- الآن لا يتم إضافة سجلات يدوياً من الكود
- إذا كان هناك trigger في قاعدة البيانات، فهو المسؤول عن التسجيل
- إذا لم يكن هناك trigger، يجب إضافة الكود مرة أخرى أو إنشاء trigger
