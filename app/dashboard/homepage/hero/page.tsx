'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import ImageUploader from '@/app/components/ImageUploader';

interface HeroSlide {
  id: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  sort_order: number;
  duration: number;
}

export default function HeroManagementPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await fetch('/api/hero-slides');
      const data = await res.json();
      if (data.success) {
        setSlides(data.data);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (slideData: Partial<HeroSlide>) => {
    try {
      const url = editingSlide ? '/api/hero-slides' : '/api/hero-slides';
      const method = editingSlide ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSlide ? { id: editingSlide.id, ...slideData } : slideData)
      });

      const data = await res.json();

      if (data.success) {
        await fetchSlides();
        setShowForm(false);
        setEditingSlide(null);
      } else {
        alert('حدث خطأ: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

    try {
      const res = await fetch(`/api/hero-slides?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        await fetchSlides();
      } else {
        alert('حدث خطأ: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slide.id,
          is_active: !slide.is_active
        })
      });

      const data = await res.json();

      if (data.success) {
        await fetchSlides();
      }
    } catch (error) {
      console.error('Error toggling active:', error);
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">إدارة البنر الرئيسي</h1>
          <p className="text-sm sm:text-base text-gray-600">إضافة وتعديل صور Hero Carousel</p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span>إضافة صورة جديدة</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <SlideForm
          slide={editingSlide}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingSlide(null);
          }}
        />
      )}

      {/* Slides Grid */}
      <div className="grid gap-3 sm:gap-4">
        {slides.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-500">لا توجد صور في البنر الرئيسي</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">ابدأ بإضافة صورة جديدة</p>
          </div>
        ) : (
          slides.map((slide) => (
            <div
              key={slide.id}
              className="bg-white rounded-lg shadow-md p-3 sm:p-4"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                {/* Drag Handle - مخفي على الموبايل الصغير */}
                <div className="hidden sm:block cursor-move text-gray-400 flex-shrink-0">
                  <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Image */}
                <div className="relative w-24 h-16 sm:w-32 sm:h-20 lg:w-40 lg:h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={slide.image_url}
                    alt="Hero slide"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0 w-full sm:w-auto">
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">الترتيب: {slide.sort_order}</span>
                    <span className="font-medium">المدة: {slide.duration}ث</span>
                  </div>
                  {slide.link_url && (
                    <div className="mt-1 sm:mt-2 text-xs text-gray-500">
                      الرابط: <span className="font-mono truncate block sm:inline">{slide.link_url}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start flex-shrink-0">
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      slide.is_active
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={slide.is_active ? 'مفعّل' : 'معطّل'}
                  >
                    {slide.is_active ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>

                  <button
                    onClick={() => {
                      setEditingSlide(slide);
                      setShowForm(true);
                    }}
                    className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(slide.id)}
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

// Slide Form Component
function SlideForm({
  slide,
  onSave,
  onCancel
}: {
  slide: HeroSlide | null;
  onSave: (data: Partial<HeroSlide>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    image_url: slide?.image_url || '',
    link_url: slide?.link_url || '',
    is_active: slide?.is_active ?? true,
    sort_order: slide?.sort_order ?? 0,
    duration: slide?.duration ?? 5
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploading) {
      alert('جاري رفع الصورة، يرجى الانتظار...');
      return;
    }

    if (!formData.image_url) {
      alert('يجب رفع صورة أولاً');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
            {slide ? 'تعديل صورة البنر' : 'إضافة صورة بنر جديدة'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                صورة البنر *
              </label>
              <ImageUploader
                currentImage={formData.image_url}
                folder="hero"
                onUploadStart={() => setIsUploading(true)}
                onUploadComplete={(url) => {
                  setFormData({ ...formData, image_url: url });
                  setIsUploading(false);
                }}
              />
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                رابط عند الضغط على الصورة (اختياري)
              </label>
              <input
                type="text"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="/category/electrical أو /products"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                إذا تركت فارغاً، لن يحدث شيء عند الضغط على الصورة
              </p>
            </div>

            {/* Duration & Sort Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  المدة (بالثواني)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  الترتيب
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded flex-shrink-0"
              />
              <label htmlFor="is_active" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                مفعّل
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={isUploading}
                className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base ${
                  isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {isUploading ? 'جاري رفع الصورة...' : slide ? 'حفظ التعديلات' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
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
