import { Metadata } from 'next';
import { safeCreateClient } from '@/lib/auth';

// توليد البيانات الوصفية للصفحة بناء على المنتج
export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  
  const supabase = await safeCreateClient();
  
  if (!supabase) {
    return {
      title: 'خطأ في تحميل المنتج',
      description: 'حدث خطأ أثناء محاولة تحميل بيانات المنتج'
    };
  }
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (!product) {
    return {
      title: 'المنتج غير موجود',
      description: 'هذا المنتج غير موجود في موقعنا'
    };
  }
  
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('type', product.category_type)
    .single();
  
  return {
    title: `${product.name} | متجر العجايبي`,
    description: product.description,
    openGraph: {
      title: `${product.name} | متجر العجايبي`,
      description: product.description,
      type: 'website',
      images: [
        {
          url: product.image,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
    // هيكلة بيانات المنتج لتحسين ظهوره في محركات البحث
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'EGP',
      'product:availability': 'in stock',
      'product:brand': 'العجايبي',
      'product:category': category?.name || '',
    },
  };
} 