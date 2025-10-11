'use client';

import { ReactNode } from 'react';
import { CheckCircle, Edit2 } from 'lucide-react';

interface CheckoutStepCardProps {
  title: string;
  stepNumber: number;
  isActive: boolean;
  isCompleted: boolean;
  onEdit?: () => void;
  children: ReactNode;
}

export default function CheckoutStepCard({
  title,
  stepNumber,
  isActive,
  isCompleted,
  onEdit,
  children
}: CheckoutStepCardProps) {
  return (
    <div className={`
      relative bg-white rounded-2xl shadow-sm border transition-all duration-300
      ${isActive ? 'border-blue-200 shadow-lg ring-1 ring-blue-100' : 'border-gray-200'}
      ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}
    `}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-6 border-b transition-colors
        ${isActive ? 'border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50' : 'border-gray-100'}
        ${isCompleted ? 'border-green-100 bg-green-50' : ''}
        rounded-t-2xl
      `}>
        <div className="flex items-center gap-4">
          {/* Step Icon */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
            ${isCompleted
              ? 'bg-green-500 text-white'
              : isActive
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }
          `}>
            {isCompleted ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              stepNumber
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className={`text-lg font-semibold transition-colors ${
              isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
            }`}>
              {title}
            </h3>
            <p className={`text-sm transition-colors ${
              isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isCompleted ? 'مكتمل' : isActive ? 'الخطوة الحالية' : 'في الانتظار'}
            </p>
          </div>
        </div>

        {/* Edit Button for completed steps */}
        {isCompleted && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm"
          >
            <Edit2 className="w-4 h-4" />
            تعديل
          </button>
        )}
      </div>

      {/* Content */}
      <div className={`
        p-6 transition-all duration-300
        ${!isActive && isCompleted ? 'opacity-75' : ''}
        ${!isActive && !isCompleted ? 'opacity-50 pointer-events-none' : ''}
      `}>
        {children}
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-full" />
        </div>
      )}
    </div>
  );
}