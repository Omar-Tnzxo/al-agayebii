'use client';

import { useState, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
  onUploadingChange?: (isUploading: boolean) => void;
}

export default function ImageUpload({ onImageUploaded, currentImage, className = '', onUploadingChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🖼️ تم اختيار ملف:', { name: file.name, size: file.size, type: file.type });

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('نوع الملف غير مدعوم. يرجى رفع صورة (JPEG, PNG, WebP)');
      return;
    }

    // التحقق من حجم الملف (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setError(null);
    setUploading(true);
    onUploadingChange?.(true); // إخبار المكون الأب أن الرفع بدأ

    try {
      // عرض معاينة فورية
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // رفع الصورة للخادم
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 بدء رفع الصورة...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في رفع الصورة');
      }

      // إشعار المكون الأب بالصورة المرفوعة
      console.log('✅ تم رفع الصورة بنجاح:', result.imageUrl);
      console.log('📢 استدعاء onImageUploaded مع URL:', result.imageUrl);
      onImageUploaded(result.imageUrl);
      
    } catch (error: any) {
      console.error('خطأ في رفع الصورة:', error);
      setError(error.message || 'حدث خطأ أثناء رفع الصورة');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
      onUploadingChange?.(false); // إخبار المكون الأب أن الرفع انتهى
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          صورة المنتج
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="حذف الصورة"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* منطقة رفع الصورة */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${preview ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="معاينة الصورة"
              width={200}
              height={200}
              className="mx-auto rounded-lg object-cover max-h-48"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
              <Camera className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {uploading ? (
              <div className="space-y-2">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-blue-600">جارٍ رفع الصورة...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-gray-700 font-medium">اضغط لرفع صورة</p>
                  <p className="text-sm text-gray-500">أو اسحب وأفلت الصورة هنا</p>
                </div>
                <p className="text-xs text-gray-400">
                  JPEG, PNG, WebP (حتى 5 ميجابايت)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
} 