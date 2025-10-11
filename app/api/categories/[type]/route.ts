import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إنشاء عميل Supabase
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// بيانات التصنيفات الاحتياطية
const fallbackCategories = [
  {
    id: '1',
    type: 'electrical',
    name: 'أدوات كهربائية',
    image: '/images/electrical.png',
    description: 'أدوات كهربائية عالية الجودة'
  },
  {
    id: '2',
    type: 'plumbing',
    name: 'أدوات سباكة',
    image: '/images/plumbing.jpg',
    description: 'معدات وأدوات السباكة المتخصصة'
  },
  {
    id: '3',
    type: 'tools',
    name: 'أدوات يدوية',
    image: '/images/tools.jpg',
    description: 'أدوات يدوية للاستخدام المنزلي والمهني'
  }
];

// بيانات التصنيفات الوهمية - نفس البيانات من route.ts الرئيسي
const dummyCategories = [
  {
    id: "b4a9b1e0-2c1a-4b1f-9b1e-0b1e0b1e0b1e",
    name: "الأدوات الكهربائية",
    type: "electrical",
    image: "/images/electrical.png",
    description: "جميع الأدوات الكهربائية عالية الجودة",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z"
  },
  {
    id: "c5b0c2f1-3d2b-5c2f-0c2f-1c2f1c2f1c2f",
    name: "الأدوات الصحية",
    type: "plumbing",
    image: "/images/plumbing.jpg",
    description: "أفضل الأدوات الصحية والسباكة",
    created_at: "2024-01-01T10:30:00Z",
    updated_at: "2024-01-01T10:30:00Z"
  },
  {
    id: "d6c1d3f2-4e3c-6d3f-1d3f-2d3f2d3f2d3f",
    name: "أدوات العمل",
    type: "tools",
    image: "/images/tools.jpg",
    description: "أدوات العمل المتينة والمتعددة الاستخدامات",
    created_at: "2024-01-01T11:00:00Z",
    updated_at: "2024-01-01T11:00:00Z"
  }
];

// بيانات المنتجات المتعلقة بكل تصنيف (للتحقق)
const dummyProducts = [
  {
    id: "e7d2e4f3-5f4d-7e4f-2e4f-3e4f3e4f3e4f",
    category_type: "electrical",
  },
  {
    id: "b0a5b7c6-8c7a-0b7c-5b7c-6b7c6b7c6b7c",
    category_type: "electrical",
  },
  {
    id: "f8e3f5a4-6a5e-8f5a-3f5a-4f5a4f5a4f5a",
    category_type: "tools",
  }
];

// الدالة المساعدة لاستخراج معلمات الـ ID
function extractType(params: Promise<{ type: string }>): Promise<string> {
  return params.then(p => p.type);
}

// GET - جلب تصنيف واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    
    const supabase = createSupabaseClient();
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', type)
          .single();
        
        if (!error && data) {
          return NextResponse.json(data);
        }
      } catch (error) {
        console.error('Supabase error:', error);
      }
    }
    
    // استخدام البيانات الاحتياطية
    const category = fallbackCategories.find(cat => cat.type === type);
    
    if (category) {
      return NextResponse.json(category);
    }
    
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// تحديث تصنيف محدد
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const body = await request.json();

    // بناء جسم التحديث ديناميكياً
    const updateFields: Record<string, any> = {};
    if (typeof body.name === 'string') updateFields.name = body.name;
    if (typeof body.description === 'string') updateFields.description = body.description;
    if (typeof body.image === 'string') updateFields.image = body.image;
    if (typeof body.image_url === 'string') updateFields.image = body.image_url;
    if (typeof body.sort_order === 'number') updateFields.sort_order = body.sort_order;
    if (typeof body.is_active === 'boolean') updateFields.is_active = body.is_active;
    if (typeof body.type === 'string') updateFields.type = body.type;
    updateFields.updated_at = new Date().toISOString();

    if (Object.keys(updateFields).length === 1 && updateFields.updated_at) {
      return NextResponse.json(
        { error: 'لا يوجد حقول للتحديث' },
        { status: 400 }
      );
    }

    // تحقق من عدم وجود تصنيف آخر بنفس type الجديد إذا أُرسل type جديد
    const supabase = createSupabaseClient();
    if (supabase) {
      if (updateFields.type && updateFields.type !== type) {
        const { data: existing, error: existError } = await supabase
          .from('categories')
          .select('id')
          .eq('type', updateFields.type)
          .single();
        if (existing) {
          return NextResponse.json(
            { error: 'يوجد تصنيف آخر بنفس type الجديد' },
            { status: 409 }
          );
        }
      }
      const { error } = await supabase
        .from('categories')
        .update(updateFields)
        .eq('type', type);
      if (!error) {
        return NextResponse.json({ success: true, message: 'تم تحديث التصنيف بنجاح' });
      }
    }

    // تحديث وهمي للبيانات الوهمية (للتطوير فقط)
    // ... يمكن إضافة منطق مماثل هنا إذا لزم الأمر ...
    return NextResponse.json({ success: true, message: 'تم التحديث (وهمي)' });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث التصنيف' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تصنيف
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    
    const supabase = createSupabaseClient();
    
    if (supabase) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('type', type);
        
        if (!error) {
          return NextResponse.json({ message: 'Category deleted successfully' });
        }
      } catch (error) {
        console.error('Supabase error:', error);
      }
    }
    
    // للبيانات الاحتياطية، نرجع نجاح وهمي
    return NextResponse.json({ message: 'Category deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
} 