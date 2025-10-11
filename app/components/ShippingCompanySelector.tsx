'use client';

// This component is deprecated - use SimpleShippingSelector instead
// Keeping for backward compatibility

import { SimpleShippingSelector } from './SimpleShippingSelector';
import type { ShippingCalculation } from '@/lib/store/shipping';

interface ShippingCompanySelectorProps {
  selectedCompany: string;
  onCompanyChange: (companyName: string) => void;
  subtotal: number;
  currency?: string;
  className?: string;
}

export function ShippingCompanySelector({
  selectedCompany,
  onCompanyChange,
  subtotal,
  currency = 'ج.م',
  className = ''
}: ShippingCompanySelectorProps) {
  const handleShippingChange = (calculation: ShippingCalculation) => {
    // For backward compatibility, we'll call onCompanyChange with a generic company name
    onCompanyChange('الشحن الافتراضي');
  };

  return (
    <SimpleShippingSelector
      subtotal={subtotal}
      currency={currency}
      className={className}
      onShippingChange={handleShippingChange}
    />
  );
}