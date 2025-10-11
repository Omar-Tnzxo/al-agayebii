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
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">إدارة البنر الرئيسي</h1>
          <p className="text-gray-600">إضافة وتعديل صور Hero Carousel</p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة صورة جديدة
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
      <div className="grid gap-4">
        {slides.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">لا توجد صور في البنر الرئيسي</p>
            <p className="text-gray-400 text-sm mt-2">ابدأ بإضافة صورة جديدة</p>
          </div>
        ) : (
          slides.map((slide) => (
            <div
              key={slide.id}
              className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4"
            >
              {/* Drag Handle */}
              <div className="cursor-move text-gray-400">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Image */}
              <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={slide.image_url}
                  alt="Hero slide"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="font-medium">الترتيب: {slide.sort_order}</span>
                  <span className="font-medium">المدة: {slide.duration}ث</span>
                </div>
                {slide.link_url && (
                  <div className="mt-2 text-xs text-gray-500">
                    الرابط: <span className="font-mono">{slide.link_url}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(slide)}
                  className={`p-2 rounded-lg transition-colors ${
                    slide.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={slide.is_active ? 'مفعّل' : 'معطّل'}
                >
                  {slide.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    setEditingSlide(slide);
                    setShowForm(true);
                  }}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="تعديل"
                >
                  <Edit className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">
            {slide ? 'تعديل صورة البنر' : 'إضافة صورة بنر جديدة'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط عند الضغط على الصورة (اختياري)
              </label>
              <input
                type="text"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="/category/electrical أو /products"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                إذا تركت فارغاً، لن يحدث شيء عند الضغط على الصورة
              </p>
            </div>

            {/* Duration & Sort Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدة (بالثواني)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1"
                />
              </div>

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
                disabled={isUploading}
                className={`flex-1 px-6 py-3 rounded-lg transition-colors font-medium ${
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
