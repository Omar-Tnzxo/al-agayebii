import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const originalSize = formData.get('originalSize') as string;
    const isCompressed = formData.get('isCompressed') === 'true';
    const compressionQuality = parseInt(formData.get('compressionQuality') as string) || 80;

    // التحقق من وجود الملف
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'لم يتم تحديد ملف' },
        { status: 400 }
      );
    }

    // التحقق من نوع الملف
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'نوع الملف غير مدعوم. الأنواع المقبولة: JPEG, PNG, WebP, SVG' },
        { status: 400 }
      );
    }

    // التحقق من حجم الملف
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `حجم الملف كبير جداً. الحد الأقصى: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = `product_${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `products/${fileName}`;

    // تحويل الملف إلى ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // رفع الملف إلى Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, fileData, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('🛑 خطأ في رفع الملف:', uploadError);
      return NextResponse.json(
        {
          success: false,
          message: 'فشل في رفع الملف',
          error: uploadError
        },
        { status: 500 }
      );
    }

    // الحصول على URL العام للملف
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      return NextResponse.json(
        { success: false, message: 'فشل في الحصول على رابط الملف' },
        { status: 500 }
      );
    }

    // إرجاع معلومات الملف
    return NextResponse.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: {
        url: urlData.publicUrl,
        path: filePath,
        fileName: fileName,
        size: file.size,
        originalSize: parseInt(originalSize) || file.size,
        isCompressed,
        compressionQuality,
        type: file.type
      }
    });

  } catch (error: any) {
    console.error('خطأ في API رفع الصور:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: حذف صورة
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: 'مسار الملف مطلوب' },
        { status: 400 }
      );
    }

    // حذف الملف من Supabase Storage
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      console.error('خطأ في حذف الملف:', error);
      return NextResponse.json(
        { success: false, message: 'فشل في حذف الملف', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الصورة بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في حذف الصورة:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ في الخادم', error: error.message },
      { status: 500 }
    );
  }
} 