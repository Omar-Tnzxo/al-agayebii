import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// SQL لإنشاء دالة PostgreSQL لتنفيذ أوامر SQL
const createExecSqlFunction = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'تم التنفيذ بنجاح';
EXCEPTION WHEN OTHERS THEN
  RETURN 'خطأ: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// SQL لإنشاء أو تعديل جدول الطلبات
const fixOrdersTableSQL = `
DO $$
BEGIN
  -- إنشاء الجدول إذا لم يكن موجودًا
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    CREATE TABLE public.orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      address TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      items_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    -- إضافة عمود address إذا لم يكن موجودًا
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'address') THEN
      ALTER TABLE public.orders ADD COLUMN address TEXT;
    END IF;
  END IF;
  
  -- إنشاء جدول عناصر الطلب إذا لم يكن موجودًا
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    CREATE TABLE public.order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;
`;

export async function GET() {
  try {
    console.log("بدء إعداد قاعدة البيانات...");
    
    // 1. إنشاء دالة exec_sql
    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql_query: createExecSqlFunction
    });
    
    if (funcError) {
      console.log("محاولة إنشاء الدالة مباشرة...");
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: createExecSqlFunction
      });
      
      if (error) {
        return NextResponse.json({
          success: false,
          message: "فشل في إنشاء دالة exec_sql",
          error: error.message
        }, { status: 500 });
      }
    }
    
    console.log("تم إنشاء دالة exec_sql بنجاح");
    
    // 2. إصلاح جدول الطلبات
    const { error: orderTableError } = await supabase.rpc('exec_sql', {
      sql_query: fixOrdersTableSQL
    });
    
    if (orderTableError) {
      return NextResponse.json({
        success: false,
        message: "فشل في إصلاح جدول الطلبات",
        error: orderTableError.message
      }, { status: 500 });
    }
    
    console.log("تم إصلاح جدول الطلبات بنجاح");
    
    // 3. التحقق من وجود الأعمدة بعد الإصلاح
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public');
      
    if (columnsError) {
      return NextResponse.json({
        success: false,
        message: "فشل في التحقق من أعمدة جدول الطلبات",
        error: columnsError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "تم إعداد قاعدة البيانات بنجاح",
      columns: columns?.map(col => col.column_name) || []
    });
  } catch (error: any) {
    console.error("خطأ في إعداد قاعدة البيانات:", error);
    return NextResponse.json({
      success: false,
      message: "حدث خطأ أثناء إعداد قاعدة البيانات",
      error: error.message
    }, { status: 500 });
  }
}

// معالج POST لتنفيذ استعلام SQL مخصص
export async function POST(request: Request) {
  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({
        success: false,
        message: "يجب تقديم استعلام SQL"
      }, { status: 400 });
    }
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: "فشل في تنفيذ الاستعلام",
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "تم تنفيذ الاستعلام بنجاح",
      result: data
    });
  } catch (error: any) {
    console.error("خطأ في تنفيذ استعلام SQL:", error);
    return NextResponse.json({
      success: false,
      message: "حدث خطأ أثناء تنفيذ الاستعلام",
      error: error.message
    }, { status: 500 });
  }
} 