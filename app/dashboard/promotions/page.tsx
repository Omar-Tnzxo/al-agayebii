'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  ExternalLink,
  ImageIcon,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import Image from 'next/image';

// واجهة شكل بيانات العرض
interface Promotion {
  id: string;
  title: string;
  description: string;
  image_url: string;
  url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  priority: number;
}

export default function PromotionsPage() {
  // حالات المكون
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // حالات نموذج إضافة/تعديل العرض
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);

  // بيانات النموذج
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [url, setUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);

  // جلب العروض عند تحميل المكون
  useEffect(() => {
    fetchPromotions();
  }, []);

  // وظيفة جلب العروض من API
  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/promotions');

      if (!response.ok) {
        throw new Error('فشل في جلب العروض');
      }

      const data = await response.json();
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error('خطأ في جلب العروض:', error);
      setError('فشل في جلب العروض');
    } finally {
      setIsLoading(false);
    }
  };

  // وظيفة إعادة تعيين النموذج
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setUrl('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setPriority(0);
    setCurrentPromotion(null);
  };

  // وظيفة فتح نموذج إضافة عرض جديد
  const openNewPromotionForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // وظيفة فتح نموذج تعديل عرض موجود
  const openEditPromotionForm = (promotion: Promotion) => {
    setCurrentPromotion(promotion);
    setTitle(promotion.title);
    setDescription(promotion.description);
    setImageUrl(promotion.image_url);
    setUrl(promotion.url);
    setStartDate(promotion.start_date);
    setEndDate(promotion.end_date);
    setIsActive(promotion.is_active);
    setPriority(promotion.priority);
    setIsFormOpen(true);
  };

  // وظيفة حفظ العرض (إضافة أو تعديل)
  const savePromotion = async () => {
    if (!title.trim()) {
      alert('يرجى إدخال عنوان العرض');
      return;
    }

    try {
      const promotionData = {
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl.trim(),
        url: url.trim(),
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
        priority: priority
      };

      let response;

      if (currentPromotion) {
        // تعديل عرض موجود
        response = await fetch(`/api/promotions/${currentPromotion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(promotionData),
        });
      } else {
        // إضافة عرض جديد
        response = await fetch('/api/promotions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(promotionData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في حفظ العرض');
      }

      // إعادة جلب العروض وإغلاق النموذج
      await fetchPromotions();
      setIsFormOpen(false);
      resetForm();

      alert(currentPromotion ? 'تم تحديث العرض بنجاح' : 'تم إضافة العرض بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ العرض:', error);
      alert(error instanceof Error ? error.message : 'فشل في حفظ العرض');
    }
  };

  // وظيفة حذف عرض
  const deletePromotion = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('فشل في حذف العرض');
      }

      // إعادة جلب العروض
      await fetchPromotions();
      alert('تم حذف العرض بنجاح');
    } catch (error) {
      console.error('خطأ في حذف العرض:', error);
      alert('فشل في حذف العرض');
    }
  };

  // وظيفة تبديل حالة العرض (نشط/غير نشط)
  const togglePromotionStatus = async (promotion: Promotion) => {
    try {
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...promotion,
          is_active: !promotion.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة العرض');
      }

      // إعادة جلب العروض
      await fetchPromotions();
    } catch (error) {
      console.error('خطأ في تحديث حالة العرض:', error);
      alert('فشل في تحديث حالة العرض');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary font-tajawal">إدارة العروض الترويجية</h1>
          <p className="text-gray-600 font-tajawal">إضافة وتعديل وحذف العروض الترويجية للمتجر</p>
        </div>
        <button
          onClick={openNewPromotionForm}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-tajawal">إضافة عرض جديد</span>
        </button>
      </div>

      {/* رسالة خطأ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* قائمة العروض */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promotion) => (
          <div key={promotion.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* صورة العرض */}
            <div className="relative h-48 bg-gray-200">
              {promotion.image_url ? (
                <Image
                  src={promotion.image_url}
                  alt={promotion.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* حالة العرض */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-sm ${
                promotion.is_active ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {promotion.is_active ? 'نشط' : 'غير نشط'}
              </div>
            </div>

            {/* تفاصيل العرض */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 font-tajawal line-clamp-2">
                {promotion.title}
              </h3>
              {promotion.description && (
                <p className="text-gray-600 text-sm mb-3 font-tajawal line-clamp-3">
                  {promotion.description}
                </p>
              )}

              {/* التواريخ */}
              <div className="text-xs text-gray-500 mb-3">
                {promotion.start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>من: {new Date(promotion.start_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                )}
                {promotion.end_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>إلى: {new Date(promotion.end_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                )}
              </div>

              {/* أزرار التحكم */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditPromotionForm(promotion)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => togglePromotionStatus(promotion)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                    title={promotion.is_active ? 'إلغاء التنشيط' : 'تنشيط'}
                  >
                    {promotion.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deletePromotion(promotion.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* رابط العرض */}
                {promotion.url && (
                  <a
                    href={promotion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="فتح الرابط"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* رسالة في حالة عدم وجود عروض */}
      {promotions.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ImageIcon className="w-24 h-24 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-2 font-tajawal">لا توجد عروض ترويجية</h3>
          <p className="text-gray-500 font-tajawal">ابدأ بإضافة عرض ترويجي جديد</p>
        </div>
      )}

      {/* نافذة إضافة/تعديل العرض */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* رأس النافذة */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary font-tajawal">
                {currentPromotion ? 'تعديل العرض' : 'إضافة عرض جديد'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* النموذج */}
            <div className="space-y-4">
              {/* عنوان العرض */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-tajawal">
                  عنوان العرض *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أدخل عنوان العرض"
                  maxLength={255}
                />
              </div>

              {/* وصف العرض */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-tajawal">
                  وصف العرض
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="أدخل وصف العرض"
                />
              </div>

              {/* رابط الصورة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-tajawal">
                  رابط الصورة
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* رابط العرض */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-tajawal">
                  رابط العرض
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/promotion"
                  maxLength={255}
                />
              </div>

              {/* التواريخ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-tajawal">
                    تاريخ البداية
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-tajawal">
                    تاريخ النهاية
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* الأولوية وحالة التنشيط */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-tajawal">
                    الأولوية
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="mr-2 text-sm font-medium text-gray-700 font-tajawal">
                    العرض نشط
                  </label>
                </div>
              </div>
            </div>

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={savePromotion}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                <Save className="w-4 h-4" />
                <span className="font-tajawal">حفظ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}