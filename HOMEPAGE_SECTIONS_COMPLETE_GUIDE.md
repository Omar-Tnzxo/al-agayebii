# 📖 دليل نظام أقسام الصفحة الرئيسية الشامل

## 🎯 نظرة عامة على النظام

نظام أقسام الصفحة الرئيسية هو نظام **ديناميكي كامل** يسمح بإدارة محتوى الصفحة الرئيسية بشكل مرن من لوحة التحكم.

---

## 📊 جداول قاعدة البيانات

### 1. جدول `homepage_sections`
يخزن معلومات الأقسام الأساسية:

```sql
CREATE TABLE homepage_sections (
  id uuid PRIMARY KEY,
  section_type VARCHAR -- 'hero_carousel' | 'categories' | 'products'
  title VARCHAR NOT NULL,
  subtitle TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**الحقول المستخدمة فعلياً:**
- ✅ `id` - معرّف القسم الفريد
- ✅ `section_type` - نوع القسم (حالياً يستخدم 'products' و 'categories' فقط)
- ✅ `title` - عنوان القسم (يظهر في الصفحة الرئيسية)
- ✅ `subtitle` - عنوان فرعي اختياري (يظهر تحت العنوان)
- ✅ `is_active` - حالة التفعيل (فقط الأقسام المفعلة تظهر)
- ✅ `sort_order` - ترتيب ظهور القسم (رقم أصغر = يظهر أولاً)
- ✅ `settings` - إعدادات JSON تحتوي على:
  - `product_source`: 'manual' | 'best_sellers' | 'new' | 'deals' | 'category'
  - `product_count`: عدد المنتجات (افتراضي 8)
  - `layout`: 'grid' | 'slider'
  - `columns`: عدد الأعمدة (2-6)
  - `show_view_all`: إظهار زر "عرض الكل"
  - `category_type`: نوع الفئة (عند اختيار product_source = 'category')

### 2. جدول `homepage_section_products`
يربط المنتجات بالأقسام اليدوية:

```sql
CREATE TABLE homepage_section_products (
  id uuid PRIMARY KEY,
  section_id uuid REFERENCES homepage_sections(id),
  product_id uuid REFERENCES products(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

**الحقول المستخدمة فعلياً:**
- ✅ `section_id` - معرّف القسم
- ✅ `product_id` - معرّف المنتج
- ✅ `sort_order` - ترتيب المنتج داخل القسم

### 3. جدول `hero_slides` (للبانر فقط)
```sql
CREATE TABLE hero_slides (
  id uuid PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 5,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**ملاحظة:** نوع القسم `hero_carousel` في `homepage_sections` **غير مستخدم حالياً**. البانر يُدار من جدول `hero_slides` منفصل.

---

## 🎛️ واجهة لوحة التحكم

### صفحة `/dashboard/homepage/sections`

#### الوظائف المتوفرة:
1. **إضافة قسم جديد** ✅
2. **تعديل قسم موجود** ✅
3. **حذف قسم** ✅
4. **تفعيل/تعطيل قسم** ✅
5. **تحريك القسم لأعلى/أسفل** ✅ (تغيير الترتيب)
6. **إدارة منتجات القسم اليدوي** ✅ (للأقسام اليدوية فقط)

#### عناصر الواجهة:
- **كارت القسم** يعرض:
  - رقم الترتيب في دائرة
  - أيقونة حسب النوع
  - العنوان والعنوان الفرعي
  - نوع القسم (منتجات/فئات)
  - مصدر المنتجات
  - عدد المنتجات
  - أزرار التحكم:
    - ⬆️ تحريك لأعلى
    - ⬇️ تحريك لأسفل
    - 📋 إدارة المنتجات (للأقسام اليدوية فقط)
    - 👁️ تفعيل/تعطيل
    - ✏️ تعديل
    - 🗑️ حذف

---

## 📝 نموذج إضافة/تعديل قسم

### الحقول المتوفرة في النموذج:

#### 1. **نوع القسم** (section_type)
- ✅ **منتجات** (products) - قسم لعرض المنتجات
- ✅ **فئات** (categories) - قسم لعرض فئات المنتجات
- ❌ **Hero Carousel** (hero_carousel) - **غير مستخدم** (يجب إزالته)

#### 2. **عنوان القسم** (title) ✅
- **يظهر في:** الصفحة الرئيسية كعنوان للقسم
- **مربوط بالداتا بيز:** نعم (حقل `title`)
- **فعّال:** نعم، يظهر دائماً

#### 3. **عنوان فرعي** (subtitle) ✅
- **يظهر في:** الصفحة الرئيسية تحت العنوان
- **مربوط بالداتا بيز:** نعم (حقل `subtitle`)
- **فعّال:** نعم، اختياري

#### 4. **مصدر المنتجات** (product_source) ✅
فقط لنوع "منتجات"

الخيارات:
- **يدوي** (manual) - تختار المنتجات بنفسك
- **الأكثر مبيعاً** (best_sellers) - تلقائياً حسب view_count
- **المنتجات الجديدة** (new) - تلقائياً حسب تاريخ الإضافة
- **العروض** (deals) - تلقائياً المنتجات التي عليها خصم
- **من فئة معينة** (category) - تلقائياً من فئة محددة

#### 5. **نوع الفئة** (category_type) ✅
- **يظهر عند:** اختيار مصدر = "من فئة معينة"
- **الخيارات:** electrical, plumbing, tools, other
- **مربوط بالداتا بيز:** نعم (في `settings.category_type`)
- **فعّال:** نعم

#### 6. **عدد المنتجات** (product_count) ✅
- **يظهر في:** عدد المنتجات التي تظهر في القسم
- **القيمة الافتراضية:** 8
- **مربوط بالداتا بيز:** نعم (في `settings.product_count`)
- **فعّال:** نعم

#### 7. **نوع العرض** (layout) ✅
- **Grid** - شبكة عادية
- **Slider** - عرض شرائح متحرك
- **مربوط بالداتا بيز:** نعم (في `settings.layout`)
- **فعّال:** نعم

#### 8. **عدد الأعمدة** (columns) ✅
- **النطاق:** 2-6 أعمدة
- **القيمة الافتراضية:** 4
- **مربوط بالداتا بيز:** نعم (في `settings.columns`)
- **فعّال:** نعم، يتحكم في عرض المنتجات

#### 9. **إظهار زر "عرض الكل"** (show_view_all) ✅
- **يظهر في:** أعلى يسار القسم في الصفحة الرئيسية
- **مربوط بالداتا بيز:** نعم (في `settings.show_view_all`)
- **فعّال:** نعم

#### 10. **حالة التفعيل** (is_active) ✅
- **الوظيفة:** إخفاء/إظهار القسم في الصفحة الرئيسية
- **مربوط بالداتا بيز:** نعم (حقل `is_active`)
- **فعّال:** نعم، يتحكم في الظهور

---

## 🎨 كيفية عمل النظام

### 1. **إنشاء قسم جديد**

**الخطوات:**
1. اذهب إلى `/dashboard/homepage/sections`
2. اضغط "إضافة قسم جديد"
3. املأ الحقول:
   - اختر نوع القسم: **منتجات**
   - أدخل عنوان القسم (مثال: "المنتجات الأكثر مبيعاً")
   - أدخل عنوان فرعي اختياري (مثال: "اختر من بين أفضل منتجاتنا")
   - اختر مصدر المنتجات:
     - **يدوي:** لاختيار المنتجات بنفسك
     - **الأكثر مبيعاً:** تلقائي
     - **المنتجات الجديدة:** تلقائي
     - **العروض:** تلقائي
     - **من فئة معينة:** تلقائي (اختر الفئة)
   - حدد عدد المنتجات (8 افتراضي)
   - اختر نوع العرض (Grid أو Slider)
   - حدد عدد الأعمدة (2-6)
   - فعّل/عطّل زر "عرض الكل"
4. احفظ

**ماذا يحدث:**
- يُضاف سجل جديد في جدول `homepage_sections`
- يُعطى القسم `sort_order` تلقائياً (آخر رقم + 1)
- إذا كان المصدر "يدوي"، ستحتاج لإضافة المنتجات يدوياً

### 2. **إضافة منتجات لقسم يدوي**

**الخطوات:**
1. في صفحة `/dashboard/homepage/sections`
2. اضغط زر 📋 "إدارة المنتجات" للقسم اليدوي
3. تُفتح صفحة `/dashboard/homepage/sections/[section_id]`
4. اضغط "إضافة منتج"
5. ابحث عن المنتج واضغط "إضافة"

**ماذا يحدث:**
- يُضاف سجل في جدول `homepage_section_products`
- يربط `section_id` مع `product_id`
- يُعطى `sort_order` تلقائياً

### 3. **عرض الأقسام في الصفحة الرئيسية**

**كيف تعمل الصفحة الرئيسية (`app/page.tsx`):**

```typescript
// 1. جلب الأقسام المفعلة مرتبة حسب sort_order
const sections = await supabase
  .from('homepage_sections')
  .select('*')
  .eq('is_active', true)
  .order('sort_order', { ascending: true });

// 2. لكل قسم، جلب المنتجات حسب المصدر
for (const section of sections) {
  if (section.settings.product_source === 'manual') {
    // جلب من جدول homepage_section_products
    const products = await supabase
      .from('homepage_section_products')
      .select('*, product_id(*)')
      .eq('section_id', section.id)
      .order('sort_order');
  } else if (section.settings.product_source === 'best_sellers') {
    // جلب تلقائياً من جدول products
    const products = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('view_count', { ascending: false })
      .limit(section.settings.product_count);
  }
  // ... وهكذا لبقية المصادر
}

// 3. عرض الأقسام باستخدام مكون DynamicProductSection
{sections.map(section => (
  <DynamicProductSection
    title={section.title}
    subtitle={section.subtitle}
    settings={section.settings}
    products={section.products}
  />
))}
```

---

## 🔍 تشخيص المشاكل الحالية

### المشكلة 1: "عدد المنتجات: 0" في `/dashboard/homepage/sections`
**السبب:** واجهة العرض لا تقرأ البيانات بشكل صحيح

**الحل:**
```typescript
// في صفحة sections/page.tsx
// تأكد من أن الكود يعرض عدد المنتجات الفعلي
{section.settings.product_count && (
  <span>عدد المنتجات: {section.settings.product_count}</span>
)}
```

### المشكلة 2: الأقسام لا تظهر في الصفحة الرئيسية
**الأسباب المحتملة:**
1. ❌ القسم معطل (`is_active = false`)
2. ❌ لا توجد منتجات في القسم اليدوي
3. ❌ المنتجات معطلة (`product.is_active = false`)
4. ❌ خطأ في جلب البيانات من API

**طريقة التشخيص:**
```sql
-- تحقق من الأقسام المفعلة
SELECT id, title, section_type, is_active, settings 
FROM homepage_sections 
WHERE is_active = true 
ORDER BY sort_order;

-- تحقق من منتجات القسم اليدوي
SELECT sp.*, p.name, p.is_active
FROM homepage_section_products sp
JOIN products p ON sp.product_id = p.id
WHERE sp.section_id = 'your-section-id'
ORDER BY sp.sort_order;
```

### المشكلة 3: نوع القسم "hero_carousel" يظهر في الخيارات
**الحل:** يجب إزالته من واجهة الإضافة لأنه غير مستخدم.

### المشكلة 4: زر تحريك القسم لا يعمل
**السبب:** مشكلة في دالة `moveSection`

**الحل:** التأكد من أن API يقبل تحديث `sort_order`

---

## 📂 الملفات المرتبطة بالنظام

### الواجهات (Frontend)
- `/app/page.tsx` - الصفحة الرئيسية
- `/app/dashboard/homepage/sections/page.tsx` - إدارة الأقسام
- `/app/dashboard/homepage/sections/[id]/page.tsx` - إدارة منتجات القسم اليدوي
- `/app/components/homepage/DynamicProductSection.tsx` - مكون عرض القسم
- `/app/components/homepage/HeroCarousel.tsx` - البانر
- `/app/components/homepage/CategoryGrid.tsx` - عرض الفئات

### APIs (Backend)
- `/app/api/homepage-sections/route.ts` - CRUD للأقسام
- `/app/api/homepage-sections/products/route.ts` - إدارة منتجات الأقسام

---

## ✅ قائمة التحقق للتأكد من عمل النظام

### قاعدة البيانات
- [ ] جدول `homepage_sections` موجود وبه بيانات
- [ ] جدول `homepage_section_products` موجود
- [ ] توجد أقسام بحالة `is_active = true`
- [ ] المنتجات المربوطة بالأقسام بحالة `is_active = true`

### لوحة التحكم
- [ ] صفحة `/dashboard/homepage/sections` تعرض الأقسام
- [ ] يمكن إضافة قسم جديد
- [ ] يمكن تعديل قسم موجود
- [ ] يمكن تحريك الأقسام لأعلى/أسفل
- [ ] يمكن الدخول لإدارة منتجات القسم اليدوي
- [ ] يمكن إضافة/حذف منتجات من القسم اليدوي

### الصفحة الرئيسية
- [ ] الأقسام تظهر بالترتيب الصحيح
- [ ] المنتجات تظهر في كل قسم
- [ ] الروابط تعمل (تستخدم slug وليس id)
- [ ] العنوان والعنوان الفرعي يظهران
- [ ] زر "عرض الكل" يظهر عند التفعيل

---

## 🎯 التوصيات

1. **إزالة نوع "hero_carousel"** من خيارات القسم (غير مستخدم)
2. **إصلاح عرض عدد المنتجات** في صفحة الأقسام
3. **إضافة realtime updates** للأقسام (Supabase Realtime)
4. **تحسين واجهة إدارة المنتجات** اليدوية
5. **إضافة معاينة مباشرة** للقسم قبل الحفظ
6. **إضافة إحصائيات** (عدد المشاهدات، النقرات لكل قسم)

---

## 🛠️ الخطوات التالية المطلوبة

1. ✅ **فحص قاعدة البيانات** - تأكيد وجود البيانات
2. ✅ **إصلاح عرض الأقسام** في الصفحة الرئيسية
3. ✅ **إصلاح روابط المنتجات** (استخدام slug)
4. ✅ **إزالة hero_carousel** من الخيارات
5. ✅ **إصلاح زر التحريك** في صفحة الأقسام
6. ✅ **اختبار النظام بالكامل**

---

## 🔗 روابط مفيدة

- صفحة الأقسام: `/dashboard/homepage/sections`
- الصفحة الرئيسية: `/`
- API الأقسام: `/api/homepage-sections`
- API منتجات الأقسام: `/api/homepage-sections/products`
