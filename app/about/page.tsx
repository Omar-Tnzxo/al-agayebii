'use client';

import { Store, Package, Users, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary text-center mb-12">
          من نحن
        </h1>

        <div className="prose prose-lg mx-auto">
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            نحن في متجر العجايبي نسعى دائماً لتقديم أفضل المنتجات بأعلى جودة وأفضل
            الأسعار. نؤمن بأن رضا العملاء هو أولويتنا الأولى، ونسعى جاهدين لتقديم
            تجربة تسوق مميزة ومريحة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
            <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Store className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold text-primary">رؤيتنا</h2>
              </div>
              <p className="text-gray-600">
                نسعى لأن نكون الوجهة الأولى للتسوق الإلكتروني في المنطقة، من خلال
                تقديم منتجات عالية الجودة وخدمة عملاء متميزة.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Package className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold text-primary">منتجاتنا</h2>
              </div>
              <p className="text-gray-600">
                نقدم مجموعة واسعة من المنتجات المختارة بعناية، مع ضمان الجودة
                والموثوقية في كل منتج.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold text-primary">فريقنا</h2>
              </div>
              <p className="text-gray-600">
                فريقنا المتميز يعمل بجد لتقديم أفضل الخدمات وضمان رضا عملائنا
                الكرام.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Award className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-semibold text-primary">جودتنا</h2>
              </div>
              <p className="text-gray-600">
                نلتزم بأعلى معايير الجودة في كل ما نقدمه، من المنتجات إلى خدمة
                العملاء.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8 mt-12">
            <h2 className="text-2xl font-semibold text-primary mb-6">
              لماذا تختارنا؟
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>منتجات عالية الجودة</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>أسعار تنافسية</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>خدمة عملاء متميزة</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>توصيل سريع</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span>ضمان الجودة</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 