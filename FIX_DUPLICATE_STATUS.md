# إصلاح مشكلة تكرار حالات الطلبات

## المشكلة
يتم تسجيل تغيير حالة الطلب مرتين في جدول `order_status_history`:
- مرة من trigger التلقائي `log_order_status_change` في قاعدة البيانات
- مرة من الكود في API (تم إصلاحه)

## السبب
هناك **function** في Supabase اسمه `log_order_status_change` يعمل كـ trigger ويضيف سجل تلقائياً عند تحديث حالة الطلب.

## الحل

### 1. تنظيف السجلات المكررة الحالية

افتح Supabase Dashboard → SQL Editor وقم بتشغيل الكود من ملف `clean-duplicates-simple.sql`

أو انسخ والصق هذا الكود:

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
```

### 2. ملاحظات مهمة

- ✅ تم إزالة الكود المكرر من `app/api/orders/[id]/route.ts`
- ✅ الآن فقط الـ trigger `log_order_status_change` هو المسؤول عن تسجيل تغييرات الحالة
- ✅ لن يحدث تكرار في المستقبل

### 3. التحقق من الإصلاح

بعد تنفيذ السكريبت:
1. افتح Dashboard → Orders
2. قم بتغيير حالة أي طلب (مثلاً من "في الانتظار" إلى "مؤكد")
3. افتح تفاصيل الطلب وانتقل إلى تبويب "تاريخ الحالات"
4. تأكد من ظهور السجل **مرة واحدة فقط**

### 4. الـ Trigger الموجود حالياً

```sql
-- Function: log_order_status_change
-- يتم تفعيله تلقائياً عند تحديث جدول orders
-- يضيف سجل في order_status_history عندما تتغير الحالة
```

## كيف يعمل النظام الآن؟

1. عند تحديث حالة طلب من Dashboard
2. يتم تحديث حقل `status` في جدول `orders`
3. الـ trigger `log_order_status_change` يعمل تلقائياً
4. يضاف سجل واحد في `order_status_history` بالملاحظة "تم تغيير الحالة تلقائياً"

## الملفات ذات الصلة

- `clean-duplicate-status-history.sql` - سكريبت تفصيلي لتنظيف السجلات
- `clean-duplicates-simple.sql` - سكريبت مبسط (استخدم هذا)
- `check-triggers.sql` - للتحقق من الـ triggers الموجودة
- `app/api/orders/[id]/route.ts` - تم إزالة الكود المكرر منه

