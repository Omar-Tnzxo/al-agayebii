'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  originalSize: number;
  compressedSize?: number;
  isCompressed: boolean;
  compressionQuality: number;
  isUploading: boolean;
  uploadProgress: number;
}

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSize?: number; // بالميجابايت
  acceptedTypes?: string[];
  compressionQuality?: number;
  autoCompress?: boolean;
  className?: string;
}

// دالة ضغط الصورة
const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    
    img.onload = () => {
      // حساب الأبعاد الجديدة (أقصى عرض/ارتفاع 1920px)
      let { width, height } = img;
      const maxDimension = 1920;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // رسم الصورة المضغوطة
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export default function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 30,
  maxFileSize = 5, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  compressionQuality = 0.8,
  autoCompress = true,
  className = ''
}: MultiImageUploadProps) {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // دالة التحقق من الملف
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `نوع الملف غير مدعوم. الأنواع المقبولة: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `حجم الملف كبير جداً. الحد الأقصى: ${maxFileSize}MB`;
    }
    
    return null;
  };

  // معالجة الملفات المرفوعة
  const processFiles = useCallback(async (files: FileList) => {
    if (imageFiles.length + files.length > maxImages) {
      setError(`لا يمكن رفع أكثر من ${maxImages} صورة`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    const newImageFiles: ImageFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }

      let processedFile = file;
      let isCompressed = false;
      let compressionQualityUsed = 100;

      // ضغط الصورة إذا كانت كبيرة أو إذا كان الضغط التلقائي مُفعّل
      if (autoCompress && file.size > 1024 * 1024) { // أكبر من 1MB
        try {
          processedFile = await compressImage(file, compressionQuality);
          isCompressed = true;
          compressionQualityUsed = Math.round(compressionQuality * 100);
        } catch (error) {
          console.error('خطأ في ضغط الصورة:', error);
        }
      }

      const imageFile: ImageFile = {
        id: Date.now().toString() + i,
        file: processedFile,
        url: URL.createObjectURL(processedFile),
        originalSize: file.size,
        compressedSize: processedFile.size,
        isCompressed,
        compressionQuality: compressionQualityUsed,
        isUploading: false,
        uploadProgress: 0
      };

      newImageFiles.push(imageFile);
    }

    setImageFiles(prev => [...prev, ...newImageFiles]);
    setIsProcessing(false);
  }, [imageFiles.length, maxImages, maxFileSize, acceptedTypes, compressionQuality, autoCompress]);

  // معالج السحب والإفلات
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // معالج اختيار الملفات
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  // حذف صورة
  const removeImage = useCallback((id: string) => {
    setImageFiles(prev => {
      const updated = prev.filter(img => img.id !== id);
      // تحديث قائمة URLs للمكون الرئيسي
      const urls = updated.map(img => img.url);
      onImagesChange(urls);
      return updated;
    });
  }, [onImagesChange]);

  // رفع الصور إلى الخادم
  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];

    const uploadPromises = imageFiles.map(async (imageFile) => {
      if (imageFile.isUploading) return null; // تجاهل الصور التي يتم رفعها حالياً

      try {
        // تحديث حالة الرفع
        setImageFiles(prev => 
          prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, isUploading: true, uploadProgress: 0 }
              : img
          )
        );

        const formData = new FormData();
        formData.append('file', imageFile.file);
        formData.append('originalSize', imageFile.originalSize.toString());
        formData.append('isCompressed', imageFile.isCompressed.toString());
        formData.append('compressionQuality', imageFile.compressionQuality.toString());

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'خطأ غير معروف' }));
          throw new Error(errorData.message || 'فشل في رفع الصورة');
        }

        const result = await response.json();
        
        // تحديث حالة النجاح
        setImageFiles(prev => 
          prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, isUploading: false, uploadProgress: 100 }
              : img
          )
        );

        return result.data?.url || result.url;
      } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        
        // تحديث حالة الخطأ
        setImageFiles(prev => 
          prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, isUploading: false, uploadProgress: 0 }
              : img
          )
        );

        // إرجاع null في حالة الفشل
        throw error;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      // تصفية النتائج الفارغة
      const validUrls = uploadedUrls.filter(url => url !== null && url !== undefined);
      
      if (validUrls.length === 0) {
        throw new Error('فشل في رفع جميع الصور');
      }
      
      if (validUrls.length < imageFiles.length) {
        setError(`تم رفع ${validUrls.length} من أصل ${imageFiles.length} صور فقط`);
      } else {
        setError(''); // مسح أي أخطاء سابقة
      }
      
      onImagesChange(validUrls);
      return validUrls;
    } catch (error) {
      setError('فشل في رفع الصور. يرجى المحاولة مرة أخرى.');
      throw error;
    }
  };

  // حساب الإحصائيات
  const totalOriginalSize = imageFiles.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressedSize = imageFiles.reduce((sum, img) => sum + (img.compressedSize || img.originalSize), 0);
  const compressionRatio = totalOriginalSize > 0 ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100) : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* منطقة الرفع */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary/50'
          }
          ${imageFiles.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => {
          if (imageFiles.length < maxImages && !isProcessing) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={imageFiles.length >= maxImages || isProcessing}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-gray-600">جارٍ معالجة الصور...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              اسحب الصور هنا أو انقر للاختيار
            </p>
            <p className="text-xs text-gray-500">
              حتى {maxImages} صورة، حد أقصى {maxFileSize}MB لكل صورة
            </p>
            <p className="text-xs text-gray-500">
              {imageFiles.length}/{maxImages} صورة مرفوعة
            </p>
          </div>
        )}
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* إحصائيات الضغط */}
      {imageFiles.length > 0 && compressionRatio > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          تم توفير {compressionRatio.toFixed(1)}% من المساحة ({((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)}MB)
        </div>
      )}

      {/* معاينة الصور */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {imageFiles.map((imageFile) => (
            <div key={imageFile.id} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={imageFile.url}
                  alt="معاينة الصورة"
                  fill
                  className="object-cover"
                />
                
                {/* مؤشر الحالة */}
                <div className="absolute top-2 right-2">
                  {imageFile.isUploading ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      imageFile.isCompressed ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      <ImageIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* زر الحذف */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(imageFile.id);
                  }}
                  className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* معلومات الملف */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div>{(imageFile.compressedSize || imageFile.originalSize) / 1024 < 1024 
                    ? `${((imageFile.compressedSize || imageFile.originalSize) / 1024).toFixed(1)}KB`
                    : `${((imageFile.compressedSize || imageFile.originalSize) / 1024 / 1024).toFixed(1)}MB`
                  }</div>
                  {imageFile.isCompressed && (
                    <div>مضغوط {imageFile.compressionQuality}%</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* أزرار الإجراءات */}
      {imageFiles.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={uploadImages}
            disabled={imageFiles.some(img => img.isUploading)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {imageFiles.some(img => img.isUploading) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            رفع الصور ({imageFiles.length})
          </button>
          
          <button
            onClick={() => {
              setImageFiles([]);
              onImagesChange([]);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            مسح الكل
          </button>
        </div>
      )}
    </div>
  );
} 