'use client';

import { CheckCircle, Circle, User, CreditCard, Truck } from 'lucide-react';

interface CheckoutProgressProps {
  currentStep: number;
}

const steps = [
  {
    id: 1,
    title: 'معلومات الشحن',
    description: 'أدخل عنوانك وتفاصيل التوصيل',
    icon: User
  },
  {
    id: 2,
    title: 'اختيار الشحن',
    description: 'حدد شركة الشحن المفضلة',
    icon: Truck
  },
  {
    id: 3,
    title: 'طريقة الدفع',
    description: 'اختر طريقة الدفع المناسبة',
    icon: CreditCard
  }
];

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              {/* Step Circle */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-400'
                }
                ${isCurrent ? 'scale-110 shadow-xl' : ''}
              `}>
                {isActive ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              {/* Step Info */}
              <div className="mt-3 text-center">
                <h4 className={`text-sm font-semibold transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-xs mt-1 transition-colors max-w-24 ${
                  isActive ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}