import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchCategories, fetchProducts } from '@/lib/data/mockData';
import { Zap, TrendingUp, Award, ShoppingBag, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'التصنيفات | متجر العجايبي',
  description: 'تصفح تصنيفات منتجات متجر العجايبي للأدوات الكهربائية والصحية',
};

// إضافة خيار revalidate
export const revalidate = 3600; // إعادة تحقق كل ساعة

export default async function CategoriesPage() {
  // جلب البيانات من الخادم
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts()
  ]);

  return (
    <main className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold ar-title mb-4">تصنيفات المنتجات</h1>
        <p className="max-w-2xl mx-auto text-accent/80">
          تصفح تصنيفات منتجاتنا المختلفة واختر ما يناسب احتياجاتك
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          // حساب عدد المنتجات في كل فئة
          const productCount = products.filter(p => p.category_type === category.type).length;

          const getCategoryIcon = () => {
            switch (category.type) {
              case "electrical":
                return <Zap className="h-4 w-4" />;
              case "plumbing":
                return <TrendingUp className="h-4 w-4" />;
              case "tools":
                return <Award className="h-4 w-4" />;
              default:
                return <ShoppingBag className="h-4 w-4" />;
            }
          };

          const getAccentColor = () => {
            switch (category.type) {
              case "electrical":
                return "bg-blue-500 text-blue-50";
              case "plumbing":
                return "bg-green-500 text-green-50";
              case "tools":
                return "bg-amber-500 text-amber-50";
              default:
                return "bg-accent text-white";
            }
          };

          return (
            <Link 
              key={category.id}
              href={`/category/${category.type}`}
              className="block group"
            >
              <div className="bg-white rounded-lg shadow-sm border border-accent/10 hover:border-accent/40 hover:shadow-md transition-all p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getAccentColor()}`}>
                    {getCategoryIcon()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-primary mb-2">{category.name}</h2>
                    <p className="text-accent/80 mb-4">{productCount} منتج</p>
                    <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                      <span>استعرض الفئة</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
} 