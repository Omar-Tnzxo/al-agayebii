import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // استعلام للتحقق من وجود الجدول
    const { error: checkError } = await supabase.from('products').select('id').limit(1);
    
    // التحقق من نوع الخطأ
    if (checkError) {
      console.error("خطأ في التحقق من جدول المنتجات:", checkError);
      
      // فحص هيكل الجدول
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'products');
      
      if (tablesError) {
        console.error("خطأ في فحص هيكل قاعدة البيانات:", tablesError);
      }
      
      // فحص الحقول إذا كان الجدول موجودًا
      if (tables && tables.length > 0) {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_schema', 'public')
          .eq('table_name', 'products');
        
        if (columnsError) {
          console.error("خطأ في فحص أعمدة الجدول:", columnsError);
        } else {
          console.log("أعمدة جدول المنتجات:", columns);
        }
      }
      
      return NextResponse.json({
        error: 'هناك مشكلة في جدول المنتجات',
        details: process.env.NODE_ENV !== 'production' ? checkError.message : undefined,
        suggestion: `
        يبدو أن هناك مشكلة في جدول المنتجات. يرجى التأكد من:
        
        1. وجود جدول 'products' في قاعدة البيانات
        2. وجود الحقول التالية بالأنواع المناسبة:
           - id (uuid)
           - name (text)
           - description (text)
           - price (decimal)
           - image (text)
           - category_type (text)
           - stock_quantity (integer)
           - is_active (boolean)
           - is_popular (boolean)
           - is_new (boolean)
           - discount (integer)
           - created_at (timestamptz)
           - updated_at (timestamptz)
        
        يمكنك إنشاء الجدول باستخدام SQL التالي في لوحة تحكم Supabase:
        
        CREATE TABLE IF NOT EXISTS public.products (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          name text NOT NULL,
          description text NOT NULL,
          price decimal(10, 2) NOT NULL,
          image text,
          category_type text NOT NULL,
          stock_quantity integer DEFAULT 0,
          is_active boolean DEFAULT true,
          is_popular boolean DEFAULT false,
          is_new boolean DEFAULT true,
          discount integer DEFAULT 0,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        `
      }, { status: 500 });
    }
    
    // التحقق من وجود الحقول المطلوبة
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, price, image, category_type, stock_quantity, is_active, is_popular, is_new, discount, created_at, updated_at')
      .limit(1);
    
    if (error) {
      console.error("خطأ في التحقق من حقول جدول المنتجات:", error);
      return NextResponse.json({
        error: 'هناك مشكلة في حقول جدول المنتجات',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        suggestion: 'تأكد من وجود جميع الحقول المطلوبة في جدول المنتجات.'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'جدول المنتجات موجود وبالشكل الصحيح',
      schema: {
        products: [
          { name: 'id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'description', type: 'text' },
          { name: 'price', type: 'decimal' },
          { name: 'image', type: 'text' },
          { name: 'category_type', type: 'text' },
          { name: 'stock_quantity', type: 'integer' },
          { name: 'is_active', type: 'boolean' },
          { name: 'is_popular', type: 'boolean' },
          { name: 'is_new', type: 'boolean' },
          { name: 'discount', type: 'integer' },
          { name: 'created_at', type: 'timestamptz' },
          { name: 'updated_at', type: 'timestamptz' }
        ]
      }
    });
  } catch (error: any) {
    console.error('خطأ في فحص قاعدة البيانات:', error);
    
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء فحص قاعدة البيانات',
        details: process.env.NODE_ENV !== 'production' ? (error.message || error.toString()) : undefined
      },
      { status: 500 }
    );
  }
}

// تنفيذ عملية إعداد جدول العروض في Supabase
export async function POST(request: Request) {
  try {
    // 1. إنشاء جدول للعروض إذا لم يكن موجودًا
    const { error: createTableError } = await supabase.rpc('create_promotions_table_if_not_exists', {
      sql: `
        CREATE TABLE IF NOT EXISTS promotions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          image_url TEXT,
          url VARCHAR(255),
          start_date TIMESTAMP WITH TIME ZONE,
          end_date TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN DEFAULT true,
          priority INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- إنشاء دالة للتحديث التلقائي لحقل updated_at
        CREATE OR REPLACE FUNCTION update_promotions_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- إنشاء المشغل (trigger) لتحديث حقل updated_at تلقائيًا
        DROP TRIGGER IF EXISTS update_promotions_timestamp ON promotions;
        CREATE TRIGGER update_promotions_timestamp
        BEFORE UPDATE ON promotions
        FOR EACH ROW
        EXECUTE PROCEDURE update_promotions_timestamp();
      `
    });

    if (createTableError) {
      console.error('خطأ في إنشاء جدول العروض:', createTableError);
      return NextResponse.json({ 
        success: false, 
        error: createTableError.message 
      }, { status: 500 });
    }

    // 2. إضافة بعض العروض الافتراضية للتجربة
    const { error: insertDataError } = await supabase
      .from('promotions')
      .upsert([
        {
          title: 'عرض خاص على أدوات الكهرباء',
          description: 'خصم 25% على جميع أدوات الكهرباء لفترة محدودة',
          image_url: '/images/promo-bg.jpg',
          url: '/category/electrical',
          is_active: true,
          priority: 1,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: 'تخفيضات كبيرة على الأدوات المنزلية',
          description: 'وفر حتى 30% على مجموعة مختارة من الأدوات المنزلية',
          image_url: '/images/default-promo.png',
          url: '/products?discount=true',
          is_active: true,
          priority: 2,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: 'عرض الشحن المجاني',
          description: 'شحن مجاني لجميع الطلبات فوق 500 جنيه',
          image_url: '/images/promo-shipping.jpg',
          url: '/shipping',
          is_active: true,
          priority: 3,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ], { onConflict: 'title' });

    if (insertDataError) {
      console.error('خطأ في إدخال بيانات العروض:', insertDataError);
      return NextResponse.json({ 
        success: false, 
        error: insertDataError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم إعداد جدول العروض بنجاح' 
    });
  } catch (error: any) {
    console.error('خطأ غير متوقع:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 