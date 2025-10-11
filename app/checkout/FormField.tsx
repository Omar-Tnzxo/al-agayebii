'use client';

import { ReactNode, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
  label,
  icon,
  error,
  hint,
  required = false,
  children
}, ref) => {
  return (
    <div ref={ref} className="space-y-2">
      {/* Label */}
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon}
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        {children}

        {/* Error Icon */}
        {error && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;