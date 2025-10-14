-- =====================================
-- أقسام الصفحة الرئيسية التجريبية
-- Sample Homepage Sections Setup
-- =====================================
-- استخدم هذا الملف لإنشاء أقسام تجريبية في الصفحة الرئيسية
-- يمكنك تنفيذ هذه الأوامر في Supabase SQL Editor

-- =====================================
-- 1. حذف الأقسام الموجودة (اختياري)
-- =====================================
-- إذا كنت تريد البدء من الصفر، احذف الأقسام الموجودة
-- DELETE FROM homepage_section_products;
-- DELETE FROM homepage_sections;

-- =====================================
-- 2. إنشاء أقسام تلقائية
-- =====================================

-- قسم 1: الأكثر مبيعاً (Best Sellers)
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'المنتجات الأكثر مبيعاً',
  'اكتشف المنتجات التي يحبها عملاؤنا',
  true,
  10,
  '{
    "product_source": "best_sellers",
    "product_count": 8,
    "layout": "grid",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- قسم 2: وصل حديثاً (New Arrivals)
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'وصل حديثاً',
  'تعرّف على أحدث منتجاتنا',
  true,
  20,
  '{
    "product_source": "new",
    "product_count": 12,
    "layout": "slider",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- قسم 3: عروض خاصة (Special Deals)
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'عروض خاصة',
  'لا تفوت هذه الفرصة! خصومات مميزة',
  true,
  30,
  '{
    "product_source": "deals",
    "product_count": 8,
    "layout": "grid",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- قسم 4: الأدوات الكهربائية (Electrical Tools)
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'الأدوات الكهربائية',
  'كل ما تحتاجه من أدوات كهربائية احترافية',
  true,
  40,
  '{
    "product_source": "category",
    "category_type": "electrical",
    "product_count": 8,
    "layout": "grid",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- قسم 5: الأدوات الصحية (Plumbing Tools)
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'الأدوات الصحية',
  'أدوات صحية عالية الجودة لجميع احتياجاتك',
  true,
  50,
  '{
    "product_source": "category",
    "category_type": "plumbing",
    "product_count": 8,
    "layout": "grid",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- قسم 6: أدوات عامة (General Tools)
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'الأدوات العامة',
  'مجموعة متنوعة من الأدوات لكل عمل',
  true,
  60,
  '{
    "product_source": "category",
    "category_type": "tools",
    "product_count": 8,
    "layout": "grid",
    "columns": 4,
    "show_view_all": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- =====================================
-- 3. إنشاء قسم يدوي (مثال)
-- =====================================

-- أولاً: إنشاء القسم
INSERT INTO homepage_sections (section_type, title, subtitle, is_active, sort_order, settings)
VALUES (
  'products',
  'مختارات الأسبوع',
  'منتجات مميزة اخترناها لك خصيصاً',
  true,
  5,
  '{
    "product_source": "manual",
    "product_count": 6,
    "layout": "grid",
    "columns": 3,
    "show_view_all": false
  }'::jsonb
)
RETURNING id;

-- ثانياً: إضافة منتجات إلى القسم اليدوي
-- استبدل 'SECTION_ID_HERE' بمعرف القسم الذي تم إنشاؤه
-- واستبدل 'PRODUCT_ID_1' إلخ بمعرفات منتجات حقيقية من قاعدة البيانات

/*
INSERT INTO homepage_section_products (section_id, product_id, sort_order)
VALUES 
  ('SECTION_ID_HERE', 'PRODUCT_ID_1', 0),
  ('SECTION_ID_HERE', 'PRODUCT_ID_2', 1),
  ('SECTION_ID_HERE', 'PRODUCT_ID_3', 2),
  ('SECTION_ID_HERE', 'PRODUCT_ID_4', 3),
  ('SECTION_ID_HERE', 'PRODUCT_ID_5', 4),
  ('SECTION_ID_HERE', 'PRODUCT_ID_6', 5);
*/

-- =====================================
-- 4. استعلامات مفيدة
-- =====================================

-- عرض جميع الأقسام
-- SELECT id, section_type, title, is_active, sort_order, settings FROM homepage_sections ORDER BY sort_order;

-- عرض الأقسام المفعّلة فقط
-- SELECT id, section_type, title, sort_order FROM homepage_sections WHERE is_active = true ORDER BY sort_order;

-- عرض قسم معين مع منتجاته (للأقسام اليدوية)
-- SELECT 
--   hs.title as section_title,
--   p.name as product_name,
--   hsp.sort_order
-- FROM homepage_sections hs
-- LEFT JOIN homepage_section_products hsp ON hs.id = hsp.section_id
-- LEFT JOIN products p ON hsp.product_id = p.id
-- WHERE hs.title = 'مختارات الأسبوع'
-- ORDER BY hsp.sort_order;

-- عد المنتجات في كل قسم يدوي
-- SELECT 
--   hs.title,
--   COUNT(hsp.id) as product_count
-- FROM homepage_sections hs
-- LEFT JOIN homepage_section_products hsp ON hs.id = hsp.section_id
-- WHERE hs.settings->>'product_source' = 'manual'
-- GROUP BY hs.id, hs.title;

-- =====================================
-- 5. تحديث الأقسام
-- =====================================

-- تعطيل قسم معين
-- UPDATE homepage_sections SET is_active = false WHERE title = 'اسم القسم';

-- تفعيل قسم معين
-- UPDATE homepage_sections SET is_active = true WHERE title = 'اسم القسم';

-- تغيير ترتيب قسم
-- UPDATE homepage_sections SET sort_order = 15 WHERE title = 'اسم القسم';

-- تغيير عدد المنتجات في قسم
-- UPDATE homepage_sections 
-- SET settings = jsonb_set(settings, '{product_count}', '12')
-- WHERE title = 'اسم القسم';

-- =====================================
-- 6. حذف الأقسام
-- =====================================

-- حذف قسم معين (سيحذف المنتجات المرتبطة تلقائياً)
-- DELETE FROM homepage_sections WHERE title = 'اسم القسم';

-- حذف جميع الأقسام (احذر!)
-- DELETE FROM homepage_section_products;
-- DELETE FROM homepage_sections;

-- =====================================
-- ملاحظات مهمة:
-- =====================================
-- 1. الأقسام التلقائية (best_sellers, new, deals, category) لا تحتاج إضافة منتجات يدوياً
-- 2. الأقسام اليدوية (manual) تحتاج إضافة منتجات عبر جدول homepage_section_products
-- 3. sort_order يحدد ترتيب ظهور الأقسام (الأصغر أولاً)
-- 4. يجب أن يكون is_active = true حتى يظهر القسم
-- 5. المنتجات نفسها يجب أن تكون مفعّلة (is_active = true) حتى تظهر

-- =====================================
-- التحقق من النتيجة
-- =====================================
-- بعد تنفيذ الأوامر، افتح الصفحة الرئيسية لرؤية الأقسام
-- قد تحتاج الانتظار 10 دقائق أو إعادة بناء الموقع

-- ✅ النظام جاهز!
