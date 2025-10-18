'use client';

import { Scale, AlertCircle, ShoppingBag, CreditCard } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary text-center mb-12">
          الشروط والأحكام
        </h1>

        <div className="prose prose-lg mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Scale className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                الشروط العامة
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              باستخدامك لموقعنا، فإنك توافق على الالتزام بهذه الشروط والأحكام.
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                شروط التسوق
              </h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>يجب أن تكون فوق 18 عاماً للشراء</li>
              <li>جميع الأسعار تشمل ضريبة القيمة المضافة</li>
              <li>نحتفظ بالحق في رفض أي طلب</li>
              <li>المنتجات المعروضة متاحة حسب المخزون</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <CreditCard className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                الدفع والتسليم
              </h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>نقبل طرق الدفع المتاحة في الموقع</li>
              <li>يتم تأكيد الطلب بعد اكتمال عملية الدفع</li>
              <li>نلتزم بتسليم الطلبات خلال الفترة المحددة</li>
              <li>يمكن تتبع حالة الطلب من خلال حسابك</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8">
            <div className="flex items-center gap-4 mb-6">
              <AlertCircle className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                الإرجاع والاستبدال
              </h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>يمكن إرجاع المنتج خلال 14 يوماً من تاريخ الاستلام</li>
              <li>يجب أن يكون المنتج في حالته الأصلية</li>
              <li>نقوم بمعالجة طلبات الإرجاع خلال 5-7 أيام عمل</li>
              <li>يتم استرداد المبلغ بنفس طريقة الدفع</li>
            </ul>
          </div>

          <div className="mt-12 text-center text-gray-500">
            <p>آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 