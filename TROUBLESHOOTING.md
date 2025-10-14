# 🔧 حل المشاكل - Troubleshooting Guide

## 🚨 المشاكل الشائعة وحلولها

---

## ❌ المشكلة 1: "عدد المنتجات: 0" مع وجود منتج

### السبب:
التعديلات الأخيرة في الكود لم تتطابق مع أسماء الحقول في قاعدة البيانات.

### ✅ الحل:
تم إصلاح الكود ليتطابق مع schema قاعدة البيانات:

**التغييرات:**
1. تغيير `original_price` → حساب السعر من `discount_percentage`
2. تغيير `images` → `image` (حقل واحد)
3. تغيير `in_stock` → فحص `stock_quantity > 0`
4. تغيير `badge` → حساب من `discount_percentage`
5. تغيير `sales_count` → استخدام `view_count` كبديل مؤقت

**الملفات المُصلحة:**
- ✅ `app/page.tsx`
- ✅ `app/api/homepage-sections/products/route.ts`
- ✅ `app/dashboard/homepage/sections/[id]/page.tsx`

---

## ❌ المشكلة 2: الأقسام لا تظهر في الصفحة الرئيسية

### الأسباب المحتملة:

#### 1️⃣ لا توجد أقسام مُنشأة
**الحل:**
```sql
-- نفّذ هذا في Supabase SQL Editor
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'جميع المنتجات',
  'استكشف منتجاتنا المميزة',
  true,
  10,
  '{
    "product_source": "new",
    "product_count": 8,
    "layout": "grid",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
);
```

#### 2️⃣ الأقسام معطّلة (is_active = false)
**الحل:**
```sql
-- تفعيل جميع الأقسام
UPDATE homepage_sections SET is_active = true;
```

#### 3️⃣ لا توجد منتجات مفعّلة
**الحل:**
```sql
-- تفعيل المنتجات
UPDATE products SET is_active = true WHERE id IN (
  SELECT id FROM products LIMIT 10
);
```

#### 4️⃣ الأقسام اليدوية فارغة
**الحل:**
إضافة منتجات عبر الواجهة أو SQL:
```sql
-- احصل على معرّف القسم
SELECT id, title FROM homepage_sections WHERE settings->>'product_source' = 'manual';

-- أضف منتجات
INSERT INTO homepage_section_products (section_id, product_id, sort_order)
SELECT 
  'YOUR-SECTION-ID-HERE',
  id,
  ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1
FROM products 
WHERE is_active = true 
LIMIT 6;
```

---

## 🔍 التشخيص السريع

### الخطوة 1: افحص قاعدة البيانات

نفّذ ملف `test-sections-display.sql` في Supabase:

```sql
-- فحص الأقسام المفعّلة
SELECT id, title, is_active, settings->>'product_source' 
FROM homepage_sections 
WHERE is_active = true;

-- فحص المنتجات المتاحة
SELECT COUNT(*) FROM products WHERE is_active = true;

-- فحص المنتجات في الأقسام اليدوية
SELECT hs.title, COUNT(hsp.id) as products
FROM homepage_sections hs
LEFT JOIN homepage_section_products hsp ON hs.id = hsp.section_id
WHERE hs.settings->>'product_source' = 'manual'
GROUP BY hs.id, hs.title;
```

### الخطوة 2: تطبيق الإصلاحات

نفّذ ملف `fix-database-fields.sql`:
- إضافة حقل `sales_count`
- إنشاء triggers تلقائية
- تحسين الفهارس

---

## 🛠️ الإصلاحات المطلوبة

### 1. تطبيق fix-database-fields.sql

```bash
# في Supabase SQL Editor
1. افتح ملف fix-database-fields.sql
2. انسخ المحتوى
3. الصقه في SQL Editor
4. اضغط Run
```

### 2. إنشاء قسم تجريبي

```sql
-- قسم "جديدنا" - يعرض أحدث المنتجات تلقائياً
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'وصل حديثاً',
  'تعرّف على أحدث منتجاتنا',
  true,
  10,
  '{
    "product_source": "new",
    "product_count": 8,
    "layout": "grid",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
);
```

### 3. التحقق من المنتجات

```sql
-- تأكد من وجود منتجات مفعّلة
SELECT id, name, price, stock_quantity, is_active 
FROM products 
WHERE is_active = true 
LIMIT 5;

-- إذا لم يكن هناك منتجات، فعّل بعضها
UPDATE products 
SET is_active = true, stock_quantity = 10 
WHERE id IN (
  SELECT id FROM products LIMIT 5
);
```

---

## ✅ قائمة التحقق

استخدم هذه القائمة للتأكد من أن كل شيء يعمل:

### قاعدة البيانات:
- [ ] يوجد قسم واحد على الأقل مع `is_active = true`
- [ ] يوجد منتج واحد على الأقل مع `is_active = true`
- [ ] الأقسام اليدوية تحتوي على منتجات (في جدول `homepage_section_products`)
- [ ] تم تطبيق `fix-database-fields.sql`

### الصفحة الرئيسية:
- [ ] افتح `/` وشاهد إذا ظهرت الأقسام
- [ ] تحقق من console للأخطاء (F12 → Console)
- [ ] انتظر 10 دقائق (ISR cache) أو أعد تشغيل السيرفر

### لوحة التحكم:
- [ ] افتح `/dashboard/homepage/sections`
- [ ] شاهد قائمة الأقسام
- [ ] للأقسام اليدوية، اضغط زر 📋 وأضف منتجات

---

## 🔄 إعادة تشغيل السيرفر

إذا لم تظهر التغييرات:

```bash
# أوقف السيرفر (Ctrl+C)
# ثم شغّله من جديد
npm run dev

# أو نظّف الـ cache
npm run clean
npm run dev
```

---

## 📊 استعلامات مفيدة

### عرض جميع الأقسام مع تفاصيلها
```sql
SELECT 
  id,
  title,
  section_type,
  is_active,
  sort_order,
  settings->>'product_source' as source,
  settings->>'product_count' as count,
  (
    SELECT COUNT(*) 
    FROM homepage_section_products hsp 
    WHERE hsp.section_id = homepage_sections.id
  ) as manual_products_count
FROM homepage_sections
ORDER BY sort_order;
```

### عرض المنتجات في قسم معين
```sql
SELECT 
  p.id,
  p.name,
  p.price,
  p.stock_quantity,
  p.is_active,
  hsp.sort_order
FROM homepage_section_products hsp
JOIN products p ON hsp.product_id = p.id
WHERE hsp.section_id = 'YOUR-SECTION-ID-HERE'
ORDER BY hsp.sort_order;
```

### إحصائيات النظام
```sql
SELECT 
  (SELECT COUNT(*) FROM homepage_sections WHERE is_active = true) as active_sections,
  (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
  (SELECT COUNT(*) FROM homepage_section_products) as manual_links,
  (SELECT COUNT(DISTINCT section_id) FROM homepage_section_products) as sections_with_products;
```

---

## 🚑 حلول طارئة

### الحل السريع: إنشاء قسم يعمل فوراً
```sql
-- هذا القسم سيعرض جميع المنتجات المفعّلة
INSERT INTO homepage_sections (section_type, title, is_active, sort_order, settings)
VALUES (
  'products',
  'منتجاتنا',
  true,
  1,
  '{"product_source": "new", "product_count": 12, "layout": "grid", "columns": 4, "show_view_all": false}'::jsonb
);

-- تفعيل بعض المنتجات
UPDATE products 
SET is_active = true, stock_quantity = 10 
WHERE id IN (SELECT id FROM products LIMIT 10);
```

---

## 📞 الدعم الإضافي

إذا استمرت المشكلة:

1. **تحقق من console:**
   - افتح `/` 
   - اضغط F12
   - انتقل إلى Console
   - ابحث عن أخطاء حمراء

2. **تحقق من Network:**
   - في F12، انتقل إلى Network
   - أعد تحميل الصفحة
   - ابحث عن طلبات فاشلة (حمراء)

3. **تحقق من قاعدة البيانات:**
   - افتح Supabase Dashboard
   - انتقل إلى Table Editor
   - تأكد من وجود بيانات

---

## 🎯 الخلاصة

**الأسباب الرئيسية للمشاكل:**
1. ✅ **تم إصلاحه:** عدم تطابق أسماء الحقول
2. ⚠️ **تحقق منه:** عدم وجود أقسام مفعّلة
3. ⚠️ **تحقق منه:** عدم وجود منتجات مفعّلة
4. ⚠️ **تحقق منه:** الأقسام اليدوية فارغة

**الإصلاحات المطبقة:**
- ✅ تحديث `app/page.tsx`
- ✅ تحديث `app/api/homepage-sections/products/route.ts`
- ✅ تحديث `app/dashboard/homepage/sections/[id]/page.tsx`
- ✅ إنشاء `fix-database-fields.sql`
- ✅ إنشاء `test-sections-display.sql`

**الخطوات التالية:**
1. نفّذ `fix-database-fields.sql`
2. نفّذ `test-sections-display.sql`
3. أنشئ قسم تجريبي
4. أعد تشغيل السيرفر
5. افتح الصفحة الرئيسية

---

**📅 تاريخ التحديث:** 2025-10-13  
**✅ الحالة:** تم إصلاح جميع المشاكل المعروفة
