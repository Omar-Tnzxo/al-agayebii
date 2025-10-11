import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase Client للخادم
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ متغيرات Supabase مفقودة:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: 'لم يتم العثور على ملف' 
        },
        { status: 400 }
      );
    }

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'نوع الملف غير مدعوم. يرجى رفع صورة (JPEG, PNG, WebP, GIF)' 
        },
        { status: 400 }
      );
    }

    // التحقق من حجم الملف (10MB كحد أقصى)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false,
          error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' 
        },
        { status: 400 }
      );
    }

    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `products/${timestamp}-${randomString}.${extension}`;

    console.log(`📤 رفع صورة جديدة: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // التحقق من توفر Supabase
      if (!supabase) {
        throw new Error('Supabase غير متاح - متغيرات البيئة مفقودة');
      }

      // تحويل الملف إلى ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // رفع الصورة إلى Supabase Storage
      let { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ خطأ في رفع الصورة إلى Supabase:', uploadError);
        
        // في حالة عدم وجود bucket، نحاول إنشاؤه
        if (uploadError.message.includes('Bucket not found')) {
          console.log('🪣 إنشاء bucket جديد...');
          
          const { error: bucketError } = await supabase.storage
            .createBucket('product-images', {
              public: true,
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
              fileSizeLimit: 10485760 // 10MB
            });

          if (bucketError && !bucketError.message.includes('already exists')) {
            throw new Error(`فشل في إنشاء bucket: ${bucketError.message}`);
          }

          // محاولة الرفع مرة أخرى
          const { data: retryData, error: retryError } = await supabase.storage
            .from('product-images')
            .upload(fileName, fileBuffer, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false
            });

          if (retryError) {
            throw retryError;
          }
          
          uploadData = retryData;
        } else {
          throw uploadError;
        }
      }

      // الحصول على الرابط العام للصورة
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('فشل في الحصول على رابط الصورة');
      }

      console.log(`✅ تم رفع الصورة بنجاح: ${urlData.publicUrl}`);

      return NextResponse.json({
        success: true,
        message: 'تم رفع الصورة بنجاح إلى Supabase Storage',
        imageUrl: urlData.publicUrl,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type,
        storage: 'supabase'
      });

    } catch (storageError: any) {
      console.error('💥 خطأ في Supabase Storage:', storageError);
      
      // لا يوجد تخزين محلي - فشل كامل
      throw new Error(`فشل في رفع الصورة إلى Supabase Storage: ${storageError.message}`);
    }

  } catch (error: any) {
    console.error('💥 خطأ عام في رفع الصورة:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'حدث خطأ أثناء رفع الصورة',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
} 