'use client';

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Upload, X, AlertCircle, CheckCircle, ImageIcon, Loader2, GripVertical, Star } from 'lucide-react';
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

export interface MultiImageUploadRef {
  uploadImages: () => Promise<string[]>;
  hasUnuploadedImages: () => boolean;
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

const MultiImageUpload = forwardRef<MultiImageUploadRef, MultiImageUploadProps>(({
  images,
  onImagesChange,
  maxImages = 30,
  maxFileSize = 5, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  compressionQuality = 0.8,
  autoCompress = true,
  className = ''
}, ref) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
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
    const totalExistingImages = images.length + imageFiles.length;
    if (totalExistingImages + files.length > maxImages) {
      setError(`لا يمكن رفع أكثر من ${maxImages} صورة. لديك حالياً ${totalExistingImages} صورة`);
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
      
      // دمج الصور الموجودة مع الصور المرفوعة حديثاً
      const allImages = [...images, ...validUrls];
      console.log('🔗 MultiImageUpload: دمج الصور - موجودة:', images.length, '+ جديدة:', validUrls.length, '= إجمالي:', allImages.length);
      onImagesChange(allImages);
      
      // مسح الصور المرفوعة من القائمة المحلية بعد الرفع بنجاح
      setImageFiles([]);
      
      // إرجاع جميع الصور (الموجودة + الجديدة) وليس فقط الجديدة
      console.log('✅ MultiImageUpload: إرجاع جميع الصور:', allImages);
      return allImages;
    } catch (error) {
      setError('فشل في رفع الصور. يرجى المحاولة مرة أخرى.');
      throw error;
    }
  };

  // دوال إعادة ترتيب الصور بالسحب والإفلات
  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleReorderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedImageIndex];
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    console.log('🔄 إعادة ترتيب الصور - من موضع', draggedImageIndex, 'إلى موضع', dropIndex);
    console.log('📸 الترتيب الجديد:', newImages);
    console.log('🌟 الصورة الأولى (الغلاف):', newImages[0]);
    
    onImagesChange(newImages);
    setDraggedImageIndex(null);
  };

  const handleReorderDragEnd = () => {
    setDraggedImageIndex(null);
  };

  // تعريض الدوال للمكون الأب عبر ref
  useImperativeHandle(ref, () => ({
    uploadImages,
    hasUnuploadedImages: () => imageFiles.length > 0
  }));

  // حساب الإحصائيات
  const totalOriginalSize = imageFiles.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressedSize = imageFiles.reduce((sum, img) => sum + (img.compressedSize || img.originalSize), 0);
  const compressionRatio = totalOriginalSize > 0 ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100) : 0;
  
  const totalImages = images.length + imageFiles.length;
  const canAddMore = totalImages < maxImages;

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
          ${!canAddMore ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => {
          if (canAddMore && !isProcessing) {
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
          disabled={!canAddMore || isProcessing}
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
              {totalImages}/{maxImages} صورة ({images.length} موجودة، {imageFiles.length} جديدة)
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

      {/* معاينة الصور الموجودة (المرفوعة سابقاً) */}
      {images.length > 0 && (
        <div className="space-y-3">
          {/* رأس القسم مع معلومات */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  <GripVertical className="w-4 h-4" />
                  الصور الموجودة ({images.length}) - يمكنك إعادة الترتيب
                </h3>
                <p className="text-xs text-blue-700">
                  اسحب الصور لتغيير ترتيبها. الصورة الأولى ستكون صورة الغلاف التي تظهر في الموقع.
                </p>
              </div>
              <div className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                <Star className="w-4 h-4 fill-yellow-500" />
                <span className="text-xs font-medium">غلاف</span>
              </div>
            </div>
          </div>
          
          {/* شبكة الصور */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((imageUrl, index) => (
              <div 
                key={`existing-${index}`} 
                className="relative group cursor-move"
                draggable
                onDragStart={(e) => handleReorderDragStart(e, index)}
                onDragOver={handleReorderDragOver}
                onDrop={(e) => handleReorderDrop(e, index)}
                onDragEnd={handleReorderDragEnd}
              >
                <div className={`relative aspect-square rounded-lg overflow-hidden bg-gray-50 transition-all ${
                  index === 0 
                    ? 'border-4 border-yellow-400 ring-2 ring-yellow-200' 
                    : draggedImageIndex === index 
                      ? 'border-2 border-blue-400 opacity-50'
                      : 'border-2 border-green-200'
                }`}>
                  <Image
                    src={imageUrl}
                    alt={`صورة موجودة ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* أيقونة السحب */}
                  <div className="absolute top-2 right-2 cursor-move">
                    <div className="w-6 h-6 bg-gray-800/70 rounded-full flex items-center justify-center">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* مؤشر الصورة الأولى (الغلاف) */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                  )}

                  {/* زر الحذف */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newImages = images.filter((_, i) => i !== index);
                      onImagesChange(newImages);
                    }}
                    className="absolute bottom-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="حذف الصورة"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* معلومات الصورة */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-center">
                      {index === 0 ? '🌟 صورة الغلاف' : `صورة #${index + 1}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* معاينة الصور الجديدة (لم يتم رفعها بعد) */}
      {imageFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">الصور الجديدة ({imageFiles.length})</h3>
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
});

MultiImageUpload.displayName = 'MultiImageUpload';

export default MultiImageUpload;