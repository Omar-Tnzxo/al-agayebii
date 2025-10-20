'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Mail, CheckCircle, ExternalLink } from 'lucide-react';
import type { Branch } from '@/lib/types/branch';

interface BranchSelectorProps {
  selectedBranchId?: string;
  onSelectBranch: (branch: Branch | null) => void;
  className?: string;
}

export default function BranchSelector({
  selectedBranchId,
  onSelectBranch,
  className = ''
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/branches?active=true');
      const result = await response.json();

      if (result.success) {
        setBranches(result.data || []);
      } else {
        setError(result.error || 'فشل في جلب الفروع');
      }
    } catch (err) {
      console.error('خطأ في جلب الفروع:', err);
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = (branch: Branch) => {
    onSelectBranch(branch);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 ${className}`}>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchBranches}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 ${className}`}>
        <p className="text-sm">لا توجد فروع متاحة حالياً. يرجى المحاولة لاحقاً.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          اختر فرع الاستلام ({branches.length} {branches.length === 1 ? 'فرع' : 'فروع'} متاحة)
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {branches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            isSelected={selectedBranchId === branch.id}
            onSelect={() => handleSelectBranch(branch)}
          />
        ))}
      </div>
    </div>
  );
}

interface BranchCardProps {
  branch: Branch;
  isSelected: boolean;
  onSelect: () => void;
}

function BranchCard({ branch, isSelected, onSelect }: BranchCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-right p-5 rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* اسم الفرع */}
          <div className="flex items-center gap-3">
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center
              ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}
            `}>
              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <h4 className="text-lg font-bold text-gray-900">{branch.name}</h4>
            {isSelected && (
              <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                محدد
              </span>
            )}
          </div>

          {/* العنوان */}
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
            <p className="text-sm">
              {branch.address}
              {branch.city && <span className="text-gray-500"> - {branch.city}</span>}
            </p>
          </div>

          {/* معلومات الاتصال وأوقات العمل */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            {branch.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <a
                  href={`tel:${branch.phone}`}
                  className="hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {branch.phone}
                </a>
              </div>
            )}

            {branch.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <a
                  href={`mailto:${branch.email}`}
                  className="hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {branch.email}
                </a>
              </div>
            )}
          </div>

          {/* أوقات العمل */}
          {branch.working_hours && (
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
              <p>{branch.working_hours}</p>
            </div>
          )}

          {/* ملاحظات */}
          {branch.notes && (
            <div className="text-sm text-gray-500 italic bg-blue-50 p-3 rounded-lg border border-blue-100">
              💡 {branch.notes}
            </div>
          )}

          {/* رابط الخريطة */}
          {branch.google_maps_url && (
            <a
              href={branch.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
              <span>عرض الموقع على الخريطة</span>
            </a>
          )}
        </div>

        {/* صورة الفرع (إذا وجدت) */}
        {branch.image_url && (
          <div className="hidden md:block flex-shrink-0">
            <img
              src={branch.image_url}
              alt={branch.name}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>
    </button>
  );
}

// مكون مبسط للاستخدام في الـ checkout
export function SimpleBranchSelector({
  selectedBranchId,
  onSelectBranch,
  className = ''
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches?active=true');

      // التحقق من أن الاستجابة ناجحة
      if (!response.ok) {
        console.error('خطأ في الاستجابة:', response.status, response.statusText);
        setBranches([]);
        setLoading(false);
        return;
      }

      // التحقق من أن الاستجابة JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('الاستجابة ليست JSON:', contentType);
        setBranches([]);
        setLoading(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setBranches(result.data || []);
      } else {
        console.error('فشل في جلب الفروع:', result.error);
        setBranches([]);
      }
    } catch (err) {
      console.error('خطأ في جلب الفروع:', err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">جاري تحميل الفروع...</div>;
  }

  if (branches.length === 0) {
    return <div className="text-sm text-red-600">لا توجد فروع متاحة</div>;
  }

  return (
    <div className={className}>
      <select
        value={selectedBranchId || ''}
        onChange={(e) => {
          const branch = branches.find(b => b.id === e.target.value);
          onSelectBranch(branch || null);
        }}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        required
      >
        <option value="">-- اختر فرع الاستلام --</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} - {branch.city || branch.address}
          </option>
        ))}
      </select>

      {selectedBranchId && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
          {(() => {
            const selectedBranch = branches.find(b => b.id === selectedBranchId);
            if (!selectedBranch) return null;
            return (
              <div className="space-y-1 text-gray-700">
                <p className="font-medium text-green-800 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  تفاصيل الفرع المختار:
                </p>
                <p><strong>العنوان:</strong> {selectedBranch.address}</p>
                {selectedBranch.phone && (
                  <p><strong>الهاتف:</strong> {selectedBranch.phone}</p>
                )}
                {selectedBranch.working_hours && (
                  <p><strong>أوقات العمل:</strong> {selectedBranch.working_hours}</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
