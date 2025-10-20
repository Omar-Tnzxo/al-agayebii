# 🚀 دليل نشر التطبيق على Netlify

## المتطلبات الأساسية

- [ ] حساب على [Netlify](https://netlify.com)
- [ ] حساب وقاعدة بيانات على [Supabase](https://supabase.com)
- [ ] مستودع Git على GitHub

---

## 📝 خطوات النشر

### 1. إعداد قاعدة البيانات Supabase

#### 1.1 إنشاء المشروع
```bash
1. اذهب إلى https://supabase.com/dashboard
2. اضغط "New Project"
3. أدخل اسم المشروع وكلمة المرور
4. انتظر حتى يتم إنشاء المشروع (2-3 دقائق)
```

#### 1.2 تشغيل SQL Scripts
```sql
1. اذهب إلى: SQL Editor في لوحة تحكم Supabase
2. انسخ والصق محتوى ملف: supabase-database.sql
3. اضغط "Run" لتنفيذ الأوامر
4. تأكد من عدم وجود أخطاء
```

#### 1.3 إنشاء كود دعوة للمدير
```sql
-- انسخ والصق هذا في SQL Editor:
SELECT create_invitation_code(
  'كود-الدعوة-السري-123',  -- غير هذا الكود
  1,                          -- عدد مرات الاستخدام
  (NOW() + INTERVAL '30 days')::TEXT  -- صلاحية 30 يوم
);
```

#### 1.4 الحصول على مفاتيح API
```bash
1. اذهب إلى: Settings > API
2. انسخ:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)
```

---

### 2. رفع الكود على GitHub

#### 2.1 التحضير
```bash
# التأكد من عدم رفع الملفات الحساسة
git status

# التأكد من وجود .gitignore صحيح
cat .gitignore
```

#### 2.2 الرفع
```bash
# إضافة جميع الملفات
git add .

# إنشاء commit
git commit -m "feat: إضافة نظام إدارة المدراء الآمن"

# رفع إلى GitHub
git push origin main
```

---

### 3. النشر على Netlify

#### 3.1 ربط المستودع
```bash
1. اذهب إلى https://app.netlify.com
2. اضغط "Add new site" > "Import an existing project"
3. اختر "GitHub"
4. اختر مستودع المشروع
```

#### 3.2 إعدادات البناء
```bash
Build command: npm run build
Publish directory: .next
Node version: 18.x أو أحدث
```

#### 3.3 إضافة المتغيرات البيئية
```bash
اذهب إلى: Site Settings > Environment Variables
أضف المتغيرات التالية:

# Required (مطلوب)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app

# Optional (اختياري)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567
NEXT_PUBLIC_HOTJAR_VERSION=6
```

#### 3.4 إعدادات إضافية
```bash
1. اذهب إلى: Site Settings > Build & Deploy
2. فعّل "Auto publishing"
3. أضف ملف netlify.toml (موجود بالفعل في المشروع)
```

---

### 4. التحقق من النشر

#### 4.1 اختبار الصفحات
```bash
✓ الصفحة الرئيسية: https://your-site.netlify.app
✓ صفحة المنتجات: https://your-site.netlify.app/products
✓ صفحة الفئات: https://your-site.netlify.app/categories
✓ تسجيل دخول المدير: https://your-site.netlify.app/admin
```

#### 4.2 إنشاء حساب مدير
```bash
1. اذهب إلى: https://your-site.netlify.app/s3cur3-r3g1st3r-@dm1n-2025
2. أدخل كود الدعوة الذي أنشأته
3. أدخل البريد الإلكتروني وكلمة المرور
4. سجل الدخول من /admin
```

---

## 🔒 الأمان

### ✅ قائمة التحقق الأمنية

- [ ] تأكد من عدم رفع `.env.local` إلى Git
- [ ] فعّل RLS (Row Level Security) في Supabase
- [ ] غيّر كود الدعوة الافتراضي
- [ ] استخدم HTTPS فقط
- [ ] راجع أذونات الجداول في Supabase
- [ ] فعّل 2FA على حساب Supabase و Netlify
- [ ] استخدم كلمات مرور قوية للمدراء

---

## 🐛 حل المشاكل الشائعة

### المشكلة: الصفحة الرئيسية لا تظهر المنتجات
```bash
السبب: عدم وجود بيانات في قاعدة البيانات
الحل:
1. تأكد من تشغيل supabase-database.sql
2. أضف منتجات من لوحة التحكم
3. تأكد من تفعيل المنتجات (is_active = true)
```

### المشكلة: لا يمكن تسجيل الدخول
```bash
السبب: بيانات غير صحيحة أو لم يتم إنشاء الحساب
الحل:
1. تأكد من إنشاء حساب أولاً من صفحة التسجيل
2. تأكد من صحة البريد وكلمة المرور
3. تحقق من console.log في المتصفح
```

### المشكلة: خطأ في المتغيرات البيئية
```bash
السبب: عدم إضافة المتغيرات في Netlify
الحل:
1. اذهب إلى: Site Settings > Environment Variables
2. تأكد من إضافة جميع المتغيرات المطلوبة
3. أعد نشر الموقع (Trigger deploy)
```

### المشكلة: صورة الموقع (favicon) لا تظهر
```bash
السبب: مسار خاطئ أو ملف غير موجود
الحل:
1. تأكد من وجود favicon.svg في مجلد public
2. امسح الكاش في المتصفح (Ctrl+Shift+R)
3. انتظر بضع دقائق لتحديث CDN
```

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. راجع [وثائق Next.js](https://nextjs.org/docs)
2. راجع [وثائق Netlify](https://docs.netlify.com)
3. راجع [وثائق Supabase](https://supabase.com/docs)
4. تحقق من console.log في المتصفح (F12)
5. راجع logs في Netlify (Site > Deploys > Deploy log)

---

## 🎉 النشر الناجح!

بعد اتباع هذه الخطوات، يجب أن يكون موقعك:

✅ متاح على الإنترنت  
✅ سريع وآمن  
✅ جاهز للاستخدام الفعلي  
✅ محمي بنظام أمان متقدم  

**ملاحظة:** أول نشر قد يستغرق 5-10 دقائق. النشر التالي سيكون أسرع.

---

**تاريخ آخر تحديث:** 2025-10-20
