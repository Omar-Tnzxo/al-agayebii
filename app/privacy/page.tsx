'use client';

import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary text-center mb-12">
          سياسة الخصوصية
        </h1>

        <div className="prose prose-lg mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                حماية بياناتك
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              نحن نلتزم بحماية خصوصية بياناتك الشخصية. نستخدم أحدث التقنيات
              والبروتوكولات الأمنية لضمان أمان معلوماتك.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Lock className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                جمع واستخدام البيانات
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              نقوم بجمع البيانات التالية:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>الاسم والبريد الإلكتروني</li>
              <li>عنوان الشحن</li>
              <li>معلومات الدفع</li>
              <li>سجل الطلبات</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Eye className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                مشاركة البيانات
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              لا نقوم بمشاركة بياناتك الشخصية مع أي طرف ثالث إلا في الحالات
              الضرورية لتقديم الخدمة، مثل شركات الشحن وشركات معالجة الدفع.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-accent/10 p-8">
            <div className="flex items-center gap-4 mb-6">
              <FileText className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-primary">
                حقوق المستخدم
              </h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              لديك الحق في:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>تصحيح أي معلومات غير دقيقة</li>
              <li>طلب حذف بياناتك</li>
              <li>الانسحاب من الاشتراكات الإخبارية</li>
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