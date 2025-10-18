import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchCategories, fetchProducts } from '@/lib/data/mockData';
import { Zap, TrendingUp, Award, ShoppingBag, ArrowRight, Package, Sparkles } from 'lucide-react';

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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">استكشف تشكيلتنا المميزة</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              تصنيفات المنتجات
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
              اكتشف مجموعة واسعة من المنتجات المصنفة خصيصاً لتلبية احتياجاتك
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Package className="h-4 w-4" />
                <span>{products.length}+ منتج</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Award className="h-4 w-4" />
                <span>{categories.length} تصنيفات</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Sparkles className="h-4 w-4" />
                <span>جودة مضمونة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 md:h-16 fill-current text-gray-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {categories.map((category) => {
            // حساب عدد المنتجات في كل فئة
            const productCount = products.filter(p => p.category_type === category.type).length;

            const getCategoryIcon = () => {
              switch (category.type) {
                case "electrical":
                  return <Zap className="h-6 w-6" />;
                case "plumbing":
                  return <TrendingUp className="h-6 w-6" />;
                case "tools":
                  return <Award className="h-6 w-6" />;
                default:
                  return <ShoppingBag className="h-6 w-6" />;
              }
            };

            const getGradientColors = () => {
              switch (category.type) {
                case "electrical":
                  return "from-blue-500 to-blue-600";
                case "plumbing":
                  return "from-green-500 to-green-600";
                case "tools":
                  return "from-amber-500 to-amber-600";
                default:
                  return "from-purple-500 to-purple-600";
              }
            };

            const getHoverGradient = () => {
              switch (category.type) {
                case "electrical":
                  return "hover:from-blue-600 hover:to-blue-700";
                case "plumbing":
                  return "hover:from-green-600 hover:to-green-700";
                case "tools":
                  return "hover:from-amber-600 hover:to-amber-700";
                default:
                  return "hover:from-purple-600 hover:to-purple-700";
              }
            };

            return (
              <Link 
                key={category.id}
                href={`/category/${category.type}`}
                className="group"
              >
                <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                  {/* Image Section */}
                  <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientColors()} ${getHoverGradient()} transition-all duration-300 flex items-center justify-center`}>
                        <div className="text-white opacity-30 group-hover:opacity-40 transition-opacity">
                          {getCategoryIcon()}
                        </div>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Icon Badge */}
                    <div className={`absolute top-4 right-4 w-12 h-12 rounded-xl bg-gradient-to-br ${getGradientColors()} shadow-lg flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-300`}>
                      {getCategoryIcon()}
                    </div>

                    {/* Product Count Badge */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <span className="text-xs font-bold text-gray-900">{productCount} منتج</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h2>
                    
                    {category.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    {/* CTA Button */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors">
                        استعرض المنتجات
                      </span>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradientColors()} flex items-center justify-center transform group-hover:translate-x-1 transition-all duration-300 shadow-md`}>
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد تصنيفات</h3>
            <p className="text-gray-600 mb-6">سيتم إضافة التصنيفات قريباً</p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">تشكيلة واسعة</h3>
              <p className="text-gray-600">مئات المنتجات المتنوعة في جميع الفئات</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">جودة عالية</h3>
              <p className="text-gray-600">منتجات أصلية ومضمونة 100%</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">أسعار تنافسية</h3>
              <p className="text-gray-600">أفضل الأسعار مع عروض مستمرة</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}