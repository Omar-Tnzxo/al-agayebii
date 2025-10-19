'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  onUploadComplete: (url: string, path: string) => void;
  onUploadStart?: () => void;
  currentImage?: string;
  folder?: string;
}

export default function ImageUploader({
  onUploadComplete,
  onUploadStart,
  currentImage,
  folder = 'hero'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('نوع الملف غير مدعوم. يجب أن يكون صورة (JPG, PNG, WEBP, GIF)');
      return;
    }

    // التحقق من حجم الملف (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setError(null);

    // معاينة الصورة
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // رفع الصورة
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);

    // إعلام المكون الأب أن الرفع بدأ
    if (onUploadStart) {
      onUploadStart();
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        onUploadComplete(data.data.url, data.data.path);
      } else {
        setError(data.error || 'فشل رفع الصورة');
        setPreview(null);
      }
    } catch (err: any) {
      setError('حدث خطأ أثناء رفع الصورة');
      setPreview(null);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('', '');
  };

  return (
    <div className="w-full">
      {/* Preview or Upload Area */}
      {preview ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
          <Image
            src={preview}
            alt="Preview"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          {/* Remove Button */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="حذف الصورة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-all"
        >
          {uploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-gray-600">جاري رفع الصورة...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">اضغط لاختيار صورة</p>
              <p className="text-gray-400 text-sm">JPG, PNG, WEBP, GIF (حد أقصى 5MB)</p>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {preview && !uploading && !error && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <span>تم رفع الصورة بنجاح</span>
        </div>
      )}
    </div>
  );
}
