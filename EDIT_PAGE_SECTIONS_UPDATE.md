# ✅ تحديث صفحة تعديل المنتج - Manual Steps

## 📋 ما تم حتى الآن:

✅ تم إضافة interfaces للأقسام  
✅ تم إضافة state للأقسام  
✅ تم إضافة جلب الأقسام المتاحة  
✅ تم إضافة جلب الأقسام الحالية للمنتج  
✅ تم تحديث API endpoint لدعم البحث بـ product_id  

## ⏭️ ما تبقى:

### 1. إضافة UI للأقسام في النموذج

ابحث في الملف `app/dashboard/products/edit/[id]/page.tsx` عن:
```tsx
{/* عرض في الصفحة الرئيسية */}
```

بعد هذا القسم، أضف:

```tsx
{/* قسم فرعي: الأقسام اليدوية */}
{homepageSections.length > 0 && (
  <div className="mt-8 pt-6 border-t border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
      الأقسام اليدوية
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      اختر الأقسام اليدوية التي تريد ظهور هذا المنتج فيها
    </p>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {homepageSections.map((section) => (
        <div
          key={section.id}
          className="flex items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          <input
            id={`section-${section.id}`}
            type="checkbox"
            checked={selectedSections.includes(section.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedSections(prev => [...prev, section.id]);
              } else {
                setSelectedSections(prev => prev.filter(id => id !== section.id));
              }
            }}
            className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor={`section-${section.id}`}
            className="mr-3 block text-sm text-indigo-900 font-medium cursor-pointer"
          >
            {section.title}
          </label>
        </div>
      ))}
    </div>

    {selectedSections.length > 0 && (
      <p className="mt-3 text-xs text-indigo-600 bg-indigo-50 p-2 rounded">
        ✓ المنتج سيظهر في {selectedSections.length} {selectedSections.length === 1 ? 'قسم' : 'أقسام'}
        {initialSections.length !== selectedSections.length && (
          <span className="mr-2 text-amber-600">
            (تم التعديل)
          </span>
        )}
      </p>
    )}
  </div>
)}
```

### 2. تحديث دالة الحفظ

ابحث عن دالة تحديث المنتج (قد تكون `handleUpdate` أو `handleSave` أو داخل `onClick` لزر الحفظ).

بعد نجاح تحديث المنتج، أضف هذا الكود:

```typescript
// تحديث الأقسام
if (productId) {
  try {
    console.log('📋 تحديث أقسام المنتج...');
    
    // 1. حذف الأقسام التي تم إلغاؤها
    const removedSections = initialSections.filter(id => !selectedSections.includes(id));
    for (const sectionId of removedSections) {
      // ابحث عن الـ link_id
      const linkResponse = await fetch(`/api/homepage-sections/products?product_id=${productId}&section_id=${sectionId}`);
      const linkData = await linkResponse.json();
      if (linkData.success && linkData.data && linkData.data.length > 0) {
        await fetch(`/api/homepage-sections/products?id=${linkData.data[0].id}`, {
          method: 'DELETE'
        });
      }
    }
    
    // 2. إضافة الأقسام الجديدة
    const addedSections = selectedSections.filter(id => !initialSections.includes(id));
    for (const sectionId of addedSections) {
      await fetch('/api/homepage-sections/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: sectionId,
          product_id: productId,
          sort_order: 999
        })
      });
    }
    
    console.log('✅ تم تحديث الأقسام:', {
      removed: removedSections.length,
      added: addedSections.length
    });
    
  } catch (sectionError) {
    console.error('⚠️ خطأ في تحديث الأقسام:', sectionError);
  }
}
```

## 🔍 أين تجد دالة الحفظ؟

ابحث في الملف عن:
- `handleUpdate`
- `handleSave`
- `onClick.*update`
- `onSubmit`
- `PUT /api/products`

عادة تكون بعد كل التحديثات الأخرى وقبل:
```typescript
toast.success('تم تحديث المنتج بنجاح');
router.push('/dashboard/products');
```

## ✅ تم!

بعد تطبيق هذه التغييرات، ستعمل صفحة التعديل مثل صفحة الإضافة تماماً!
