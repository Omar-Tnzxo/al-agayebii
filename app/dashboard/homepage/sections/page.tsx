'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Settings, List } from 'lucide-react';

interface HomepageSection {
  id: string;
  section_type: 'categories' | 'products';
  title: string;
  subtitle?: string;
  is_active: boolean;
  sort_order: number;
  settings: {
    product_source?: 'best_sellers' | 'new' | 'deals' | 'category' | 'manual';
    category_type?: string;
    product_count?: number;
    layout?: 'grid' | 'slider';
    columns?: number;
    show_view_all?: boolean;
  };
}

export default function HomepageSectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/homepage-sections');
      const data = await res.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sectionData: Partial<HomepageSection>) => {
    try {
      const method = editingSection ? 'PUT' : 'POST';

      const res = await fetch('/api/homepage-sections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSection ? { id: editingSection.id, ...sectionData } : sectionData)
      });

      const data = await res.json();

      if (data.success) {
        await fetchSections();
        setShowForm(false);
        setEditingSection(null);
      } else {
        alert('حدث خطأ: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;

    try {
      const res = await fetch(`/api/homepage-sections?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        await fetchSections();
      } else {
        alert('حدث خطأ: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const toggleActive = async (section: HomepageSection) => {
    try {
      const res = await fetch('/api/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: section.id,
          is_active: !section.is_active
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchSections();
      }
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const currentSection = sections[currentIndex];
    const targetSection = sections[targetIndex];

    try {
      // تبديل sort_order بين القسمين
      await Promise.all([
        fetch('/api/homepage-sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentSection.id,
            sort_order: targetSection.sort_order
          })
        }),
        fetch('/api/homepage-sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetSection.id,
            sort_order: currentSection.sort_order
          })
        })
      ]);

      await fetchSections();
    } catch (error) {
      console.error('Error moving section:', error);
      alert('حدث خطأ أثناء نقل القسم');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">إدارة أقسام الصفحة الرئيسية</h1>
          <p className="text-sm sm:text-base text-gray-600">إضافة وتعديل أقسام المنتجات في الصفحة الرئيسية</p>
        </div>
        <button
          onClick={() => {
            setEditingSection(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <SectionForm
          section={editingSection}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
        />
      )}

      {/* Sections Grid */}
      <div className="grid gap-3 sm:gap-4">
        {sections.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-500">لا توجد أقسام في الصفحة الرئيسية</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">ابدأ بإضافة قسم جديد</p>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow-md p-3 sm:p-4"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                {/* Move Up/Down Buttons - مخفي على الموبايل الصغير */}
                <div className="hidden sm:flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                    }`}
                    title="تحريك لأعلى"
                  >
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 rotate-90" />
                  </button>
                  <button
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className={`p-1 rounded transition-colors ${
                      index === sections.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                    }`}
                    title="تحريك لأسفل"
                  >
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 -rotate-90" />
                  </button>
                </div>

                {/* Order Number Badge */}
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm flex-shrink-0">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  section.section_type === 'products' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base sm:text-lg text-primary truncate">
                      {section.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                      section.section_type === 'products' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {section.section_type === 'products' ? 'منتجات' : 'فئات'}
                    </span>
                  </div>
                  {section.subtitle && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{section.subtitle}</p>
                  )}
                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                    <span className="whitespace-nowrap">الترتيب: {section.sort_order}</span>
                    {section.section_type === 'products' && section.settings.product_source && (
                      <span className="whitespace-nowrap">المصدر: {getSectionSourceLabel(section.settings.product_source)}</span>
                    )}
                    {section.settings.product_count && (
                      <span className="whitespace-nowrap">عدد المنتجات: {section.settings.product_count}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start flex-shrink-0">
                  {/* زر إدارة المنتجات (للأقسام اليدوية فقط) */}
                  {section.section_type === 'products' && section.settings.product_source === 'manual' && (
                    <button
                      onClick={() => router.push(`/dashboard/homepage/sections/${section.id}`)}
                      className="p-1.5 sm:p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                      title="إدارة المنتجات"
                    >
                      <List className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => toggleActive(section)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      section.is_active
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={section.is_active ? 'مفعّل' : 'معطّل'}
                  >
                    {section.is_active ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>

                  <button
                    onClick={() => {
                      setEditingSection(section);
                      setShowForm(true);
                    }}
                    className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(section.id)}
                    className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper function
const getSectionSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    best_sellers: 'الأكثر مبيعاً',
    new: 'جديد',
    deals: 'عروض',
    category: 'من فئة معينة',
    manual: 'يدوي'
  };
  return labels[source] || source;
};

// Section Form Component
function SectionForm({
  section,
  onSave,
  onCancel
}: {
  section: HomepageSection | null;
  onSave: (data: Partial<HomepageSection>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    section_type: section?.section_type || 'products' as 'categories' | 'products',
    title: section?.title || '',
    subtitle: section?.subtitle || '',
    is_active: section?.is_active ?? true,
    sort_order: section?.sort_order ?? 0,
    settings: section?.settings || {
      product_source: 'manual' as const,
      category_type: '',
      product_count: 8,
      layout: 'grid' as const,
      columns: 4,
      show_view_all: true
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      alert('العنوان مطلوب');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
            {section ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Section Type */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                نوع القسم *
              </label>
              <select
                value={formData.section_type}
                onChange={(e) => setFormData({
                  ...formData,
                  section_type: e.target.value as 'categories' | 'products'
                })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                required
              >
                <option value="products">قسم منتجات</option>
                <option value="categories">قسم فئات</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                العنوان *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان الفرعي
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Products Section Settings */}
            {formData.section_type === 'products' && (
              <>
                {/* Product Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مصدر المنتجات
                  </label>
                  <select
                    value={formData.settings.product_source}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        product_source: e.target.value as any
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="manual">اختيار يدوي</option>
                    <option value="best_sellers">الأكثر مبيعاً</option>
                    <option value="new">جديد</option>
                    <option value="deals">عروض</option>
                    <option value="category">من فئة معينة</option>
                  </select>
                </div>

                {/* Category Type (if source is category) */}
                {formData.settings.product_source === 'category' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع الفئة
                    </label>
                    <select
                      value={formData.settings.category_type || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          category_type: e.target.value
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">اختر الفئة</option>
                      <option value="electrical">أدوات كهربائية</option>
                      <option value="plumbing">أدوات صحية</option>
                      <option value="tools">أدوات عامة</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                )}

                {/* Layout & Count */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التخطيط
                    </label>
                    <select
                      value={formData.settings.layout}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          layout: e.target.value as 'grid' | 'slider'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="grid">شبكة</option>
                      <option value="slider">سلايدر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الأعمدة
                    </label>
                    <input
                      type="number"
                      value={formData.settings.columns}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          columns: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="2"
                      max="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عدد المنتجات
                    </label>
                    <input
                      type="number"
                      value={formData.settings.product_count}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          product_count: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                {/* Show View All */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_view_all"
                    checked={formData.settings.show_view_all}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        show_view_all: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="show_view_all" className="text-sm font-medium text-gray-700">
                    إظهار زر "عرض الكل"
                  </label>
                </div>
              </>
            )}

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الترتيب
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                مفعّل
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {section ? 'حفظ التعديلات' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
