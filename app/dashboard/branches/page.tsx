'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, MapPin, Phone, Mail, Clock,
  CheckCircle, XCircle, RefreshCw, Save, X, ExternalLink
} from 'lucide-react';
import type { Branch, CreateBranchInput } from '@/lib/types/branch';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    const filtered = branches.filter(branch =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch.address && branch.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (branch.governorate && branch.governorate.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredBranches(filtered);
  }, [searchTerm, branches]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/branches');
      const result = await response.json();

      if (result.success) {
        setBranches(result.data || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الفروع:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;

    try {
      const response = await fetch(`/api/branches/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || 'تم الحذف بنجاح');
        fetchBranches();
      } else {
        alert(result.error || 'فشل في الحذف');
      }
    } catch (error) {
      console.error('خطأ في حذف الفرع:', error);
      alert('خطأ في حذف الفرع');
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const response = await fetch(`/api/branches/${branch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !branch.is_active })
      });

      const result = await response.json();

      if (result.success) {
        fetchBranches();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الفرع:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">إدارة الفروع</h1>
            <p className="text-gray-600">إدارة فروع المتجر المتاحة للاستلام المباشر</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBranches}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>

            <button
              onClick={() => {
                setEditingBranch(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة فرع جديد
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث في الفروع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Branches List */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد فروع'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'جرب كلمات بحث أخرى' : 'ابدأ بإضافة فرع جديد'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة فرع جديد
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBranches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={() => {
                setEditingBranch(branch);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(branch.id)}
              onToggleActive={() => handleToggleActive(branch)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <BranchModal
          branch={editingBranch}
          onClose={() => {
            setShowModal(false);
            setEditingBranch(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingBranch(null);
            fetchBranches();
          }}
        />
      )}
    </div>
  );
}

// Branch Card Component
function BranchCard({
  branch,
  onEdit,
  onDelete,
  onToggleActive
}: {
  branch: Branch;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-primary">{branch.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${
                branch.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {branch.is_active ? (
                  <>
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    نشط
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 inline mr-1" />
                    معطل
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleActive}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={branch.is_active ? 'تعطيل' : 'تفعيل'}
          >
            {branch.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{branch.address}</span>
        </div>

        {branch.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{branch.phone}</span>
          </div>
        )}

        {branch.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>{branch.email}</span>
          </div>
        )}

        {branch.working_hours && (
          <div className="flex items-start gap-2 bg-gray-50 p-2 rounded">
            <Clock className="w-4 h-4 mt-0.5" />
            <span className="text-xs">{branch.working_hours}</span>
          </div>
        )}

        {branch.google_maps_url && (
          <a
            href={branch.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            <span>عرض على الخريطة</span>
          </a>
        )}
      </div>
    </div>
  );
}

// Branch Modal Component
function BranchModal({
  branch,
  onClose,
  onSuccess
}: {
  branch: Branch | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateBranchInput>({
    name: branch?.name || '',
    address: branch?.address || '',
    governorate: branch?.governorate || '',
    phone: branch?.phone || '',
    email: branch?.email || '',
    working_hours: branch?.working_hours || '',
    google_maps_url: branch?.google_maps_url || '',
    is_active: branch?.is_active !== undefined ? branch.is_active : true,
    sort_order: branch?.sort_order || 0
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.governorate || !formData.phone) {
      alert('الاسم والعنوان والمحافظة ورقم الهاتف مطلوبة');
      return;
    }

    try {
      setSaving(true);

      const url = branch ? `/api/branches/${branch.id}` : '/api/branches';
      const method = branch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || 'تم الحفظ بنجاح');
        onSuccess();
      } else {
        alert(result.error || 'فشل في الحفظ');
      }
    } catch (error) {
      console.error('خطأ في حفظ الفرع:', error);
      alert('خطأ في حفظ الفرع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {branch ? 'تعديل الفرع' : 'إضافة فرع جديد'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الفرع <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="مثال: الفرع الرئيسي"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={2}
                placeholder="مثال: شارع التحرير، وسط البلد"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المحافظة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="القاهرة"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0123456789"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="branch@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">أوقات العمل</label>
              <textarea
                value={formData.working_hours}
                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={2}
                placeholder="السبت - الخميس: 9:00 صباحاً - 9:00 مساءً"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">رابط Google Maps</label>
              <input
                type="url"
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">فرع نشط</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
