import { NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // فحص الاتصال بقاعدة البيانات
    const connectionStatus = await checkSupabaseConnection();
    
    if (!connectionStatus.connected) {
      return NextResponse.json({
        connected: false,
        error: connectionStatus.error || 'فشل في الاتصال بقاعدة البيانات'
      }, { status: 500 });
    }
    
    // فحص الجداول المطلوبة
    const tables = [
      { name: 'products', fields: ['id', 'name', 'description', 'price', 'image', 'category_type', 'stock_quantity'] },
      { name: 'categories', fields: ['id', 'name', 'type', 'description', 'image'] },
    ];
    
    const tablesStatus = [];
    
    for (const table of tables) {
      try {
        // فحص وجود الجدول
        const { data, error } = await supabase
          .from(table.name)
          .select('id')
          .limit(1);
        
        if (error) {
          tablesStatus.push({
            name: table.name,
            exists: false,
            error: error.message
          });
          continue;
        }
        
        // فحص الحقول
        const { data: columnInfo, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', table.name);
        
        if (columnError) {
          tablesStatus.push({
            name: table.name,
            exists: true,
            fieldsOk: false,
            error: columnError.message
          });
          continue;
        }
        
        const existingColumns = columnInfo?.map(col => col.column_name) || [];
        const missingFields = table.fields.filter(field => !existingColumns.includes(field));
        
        tablesStatus.push({
          name: table.name,
          exists: true,
          fieldsOk: missingFields.length === 0,
          missingFields: missingFields.length > 0 ? missingFields : undefined,
          existingColumns
        });
      } catch (error: any) {
        tablesStatus.push({
          name: table.name,
          exists: false,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      connected: true,
      tables: tablesStatus,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ موجود' : '✗ غير موجود',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ موجود' : '✗ غير موجود'
      }
    });
  } catch (error: any) {
    console.error('خطأ في فحص حالة قاعدة البيانات:', error);
    
    return NextResponse.json({
      connected: false,
      error: error.message || 'حدث خطأ أثناء فحص حالة قاعدة البيانات'
    }, { status: 500 });
  }
} 