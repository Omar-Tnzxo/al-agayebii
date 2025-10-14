# تشخيص مشكلة صور التصنيفات

## المشكلة
عند إضافة أو تعديل تصنيف واختيار صورة، يتم رفع الصورة على قاعدة البيانات لكن لا يتم ربطها بالتصنيف.

## خطوات التشخيص

تم إضافة logging شامل في جميع المراحل لتتبع المشكلة:

### 1. في المتصفح (Browser Console)

افتح Developer Tools (F12) وانتقل إلى Console tab، ثم:

#### عند إضافة تصنيف جديد:
1. اذهب إلى `/dashboard/categories/new`
2. املأ البيانات واختر صورة
3. راقب الرسائل التالية في Console:

```
🖼️ تم اختيار ملف: { name: "...", size: ..., type: "..." }
📤 بدء رفع الصورة...
✅ تم رفع الصورة بنجاح: https://...
📢 استدعاء onImageUploaded مع URL: https://...
📥 تحديث صورة التصنيف في state: https://...
```

4. عند الضغط على "حفظ"، راقب:
```
📤 إرسال بيانات التصنيف الجديد: { name: "...", image: "https://...", ... }
```

#### عند تعديل تصنيف:
1. اذهب إلى `/dashboard/categories/edit/[type]`
2. اختر صورة جديدة أو عدّل الموجودة
3. راقب نفس الرسائل أعلاه
4. عند الضغط على "حفظ"، راقب:
```
📤 إرسال بيانات تحديث التصنيف: { name: "...", image: "https://...", ... }
```

### 2. في Terminal (Development Server)

في terminal حيث يعمل `npm run dev`, راقب:

#### عند إضافة تصنيف:
```
POST /api/categories
📝 محاولة إضافة تصنيف جديد: { name: "...", type: "...", image: "https://...", ... }
✅ تم إضافة التصنيف بنجاح: { id: "...", name: "...", image: "...", ... }
```

#### عند تعديل تصنيف:
```
PATCH /api/categories/[type]
📝 بيانات التحديث المستلمة: { name: "...", image: "https://...", ... }
📝 الحقول المراد تحديثها: { name: "...", image: "...", updated_at: "...", ... }
✅ تم تحديث التصنيف بنجاح: { id: "...", name: "...", image: "...", ... }
```

## التحليل المتوقع

### إذا كانت المشكلة في رفع الصورة:
- لن تظهر رسالة `✅ تم رفع الصورة بنجاح`
- أو لن يظهر URL صحيح في `📢 استدعاء onImageUploaded`
- **الحل:** تحقق من API endpoint `/api/upload` و Supabase storage configuration

### إذا كانت المشكلة في تحديث الـ State:
- ستظهر رسالة رفع الصورة لكن لن تظهر `📥 تحديث صورة التصنيف في state`
- أو سيظهر URL فارغ في `📤 إرسال بيانات التصنيف`
- **الحل:** المشكلة في React state management في المكون

### إذا كانت المشكلة في API:
- سيظهر URL الصورة في `📤 إرسال بيانات التصنيف`
- لكن لن يظهر في `📝 محاولة إضافة تصنيف جديد` (server side)
- أو سيظهر لكن لن يُحفظ في قاعدة البيانات
- **الحل:** تحقق من:
  - API route handler في `/api/categories/route.ts` أو `/api/categories/[type]/route.ts`
  - Supabase query للتأكد من أن حقل `image` يُرسل بشكل صحيح

### إذا كانت المشكلة في قاعدة البيانات:
- سيظهر كل شيء صحيح في Logs
- لكن عند التحقق من Database، الحقل `image` سيكون فارغًا أو NULL
- **الحل:** 
  - تحقق من schema الجدول `categories` في Supabase
  - تأكد من أن العمود `image` موجود ونوعه `text`
  - تحقق من permissions (RLS policies) للجدول

## التحقق من قاعدة البيانات

قم بتشغيل هذا الـ SQL في Supabase SQL Editor:

```sql
-- التحقق من schema الجدول
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories' AND column_name = 'image';

-- عرض جميع التصنيفات مع الصور
SELECT id, name, type, image, created_at, updated_at
FROM categories
ORDER BY created_at DESC;
```

## الخطوات التالية

1. قم بتشغيل development server: `npm run dev`
2. افتح المتصفح وConsole
3. جرّب إضافة تصنيف جديد مع صورة
4. انسخ جميع الـ logs من Console و Terminal
5. إذا لم تحل المشكلة، شارك الـ logs لمزيد من التحليل

## ملفات تم تعديلها

التعديلات شملت إضافة console.log في:

1. `/components/ImageUpload.tsx` - تتبع رفع الصورة
2. `/app/dashboard/categories/new/page.tsx` - تتبع state والإرسال للـ API
3. `/app/dashboard/categories/edit/[type]/page.tsx` - تتبع state والإرسال للـ API
4. `/app/api/categories/route.ts` - تتبع استلام وحفظ البيانات
5. `/app/api/categories/[type]/route.ts` - تتبع استلام وتحديث البيانات

## إزالة Logging بعد الإصلاح

بعد تحديد وإصلاح المشكلة، يمكنك إزالة جميع أسطر `console.log` لتنظيف الكود.
