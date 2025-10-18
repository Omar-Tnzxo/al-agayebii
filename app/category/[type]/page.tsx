import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CategoryPageClient from './CategoryPageClient';

// جلب بيانات التصنيف والمنتجات عبر type مباشرة من Supabase
async function getCategoryDataByType(type: string) {
  try {
    console.log('🔍 جلب بيانات التصنيف:', type);
    
    // جلب بيانات التصنيف من Supabase مباشرة
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', type.toLowerCase())
      .limit(1)
      .single();
    
    if (categoryError) {
      console.error('❌ خطأ في جلب التصنيف:', categoryError);
      return { category: null, products: [] };
    }
    
    const category = categories;
    
    if (!category) {
      console.log('❌ لم يتم العثور على التصنيف');
      return { category: null, products: [] };
    }
    
    console.log('📦 التصنيف المطابق:', category);
    
    // جلب منتجات التصنيف من Supabase مباشرة
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('category_type', category.type)
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.error('❌ خطأ في جلب المنتجات:', productsError);
      return { category, products: [] };
    }
    
    console.log('✅ المنتجات:', products?.length || 0, 'منتج');
    
    return { category, products: products || [] };
  } catch (error) {
    console.error('❌ Error in getCategoryDataByType:', error);
    return { category: null, products: [] };
  }
}

export async function generateMetadata({ params }: { params: { type: string } }): Promise<Metadata> {
  const { type } = params;
  const { category } = await getCategoryDataByType(type);
  if (!category) {
    return {
      title: 'التصنيف غير موجود',
      description: 'لم يتم العثور على التصنيف المطلوب.'
    };
  }
  return {
    title: `${category.name} | التصنيفات`,
    description: category.description || `منتجات تصنيف ${category.name}`
  };
}

// إضافة dynamic config
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoryTypePage({ params }: { params: { type: string } }) {
  const { type } = params;
  const { category, products: categoryProducts } = await getCategoryDataByType(type);
  
  if (!category) {
    notFound();
  }
  
  return <CategoryPageClient category={category} initialProducts={categoryProducts} />;
}