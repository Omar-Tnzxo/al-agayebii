'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  UserPlus,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Loader2,
  Crown,
  User,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Admin {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'manager';
  is_active: boolean;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  failed_login_attempts?: number;
}

export default function AdminsManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  const [primaryAdminId, setPrimaryAdminId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' as Admin['role'],
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
    old: false,
    new: false,
    confirmNew: false,
  });

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (response.status === 401) {
        toast.error('انتهت جلستك، يرجى تسجيل الدخول مرة أخرى');
        localStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_user');
        window.location.href = '/admin';
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAdmins(data.admins || []);
        // Set primary admin (oldest account)
        if (data.admins && data.admins.length > 0) {
          const sortedByDate = [...data.admins].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setPrimaryAdminId(sortedByDate[0].id);
        }
      } else {
        toast.error(data.error || 'فشل في جلب البيانات');
      }
    } catch (error) {
      console.error('خطأ في جلب المديرين:', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Get current user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUserRole(user.role || 'admin');
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Create admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('البريد الإلكتروني غير صالح');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error('كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      if (response.status === 403) {
        toast.error('غير مصرح لك بإنشاء مديرين جدد');
      } else if (data.success) {
        toast.success('تم إنشاء المدير بنجاح');
        setShowCreateModal(false);
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          role: 'admin',
          phone: '',
        });
        fetchAdmins();
      } else {
        toast.error(data.error || 'فشل في إنشاء المدير');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء المدير');
    }
  };

  // Update admin
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAdmin) return;

    // Validation
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('البريد الإلكتروني غير صالح');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAdmin.id,
          email: formData.email,
          role: formData.role,
          phone: formData.phone || undefined,
          is_active: selectedAdmin.is_active,
        }),
      });

      const data = await response.json();

      if (response.status === 403) {
        toast.error('غير مصرح لك بتعديل هذا المدير');
      } else if (data.success) {
        toast.success('تم تحديث المدير بنجاح');
        setShowEditModal(false);
        setSelectedAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || 'فشل في تحديث المدير');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث المدير');
    }
  };

  // Validate password strength
  const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
    if (!password || password.length < 8) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*...)' };
    }
    return { isValid: true };
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAdmin) {
      toast.error('لم يتم تحديد المدير');
      return;
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message || 'كلمة المرور غير صالحة');
      return;
    }

    // Check password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    // Check old password for non-super-admins
    const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    const isChangingSelf = currentUser.id === selectedAdmin.id;
    const isSuperAdmin = currentUser.role === 'super_admin';

    if (isChangingSelf && !isSuperAdmin && !passwordData.oldPassword) {
      toast.error('كلمة المرور القديمة مطلوبة');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: selectedAdmin.id,
          oldPassword: passwordData.oldPassword || undefined,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        toast.error('انتهت جلستك، يرجى تسجيل الدخول مرة أخرى');
        localStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_user');
        window.location.href = '/admin';
      } else if (response.status === 403) {
        toast.error(data.error || 'ليس لديك صلاحية لإجراء هذا التغيير');
      } else if (response.status === 400) {
        toast.error(data.error || 'بيانات غير صحيحة');
      } else if (data.success) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setShowPasswordModal(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setSelectedAdmin(null);
        
        // If user changed their own password, log them out
        if (isChangingSelf) {
          setTimeout(() => {
            toast.info('يرجى تسجيل الدخول مرة أخرى بكلمة المرور الجديدة');
            localStorage.removeItem('admin_user');
            sessionStorage.removeItem('admin_user');
            window.location.href = '/admin';
          }, 1500);
        }
      } else {
        toast.error(data.error || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      toast.error('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle admin status
  const toggleAdminStatus = async (admin: Admin) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: admin.id,
          is_active: !admin.is_active,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`تم ${!admin.is_active ? 'تفعيل' : 'تعطيل'} المدير بنجاح`);
        fetchAdmins();
      } else {
        toast.error(data.error || 'فشل في تحديث الحالة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (admin: Admin) => {
    if (!confirm(`هل أنت متأكد من تعطيل حساب المدير ${admin.email}؟\n\nملاحظة: سيتم تعطيل الحساب وليس حذفه نهائياً.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${admin.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.status === 403) {
        toast.error(data.error || 'لا يمكنك حذف هذا المدير');
      } else if (data.success) {
        toast.success('تم تعطيل المدير بنجاح');
        fetchAdmins();
      } else {
        toast.error(data.error || 'فشل في تعطيل المدير');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تعطيل المدير');
    }
  };

  // Filter admins
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && admin.is_active) ||
      (filterStatus === 'inactive' && !admin.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Role badge
  const getRoleBadge = (role: string) => {
    const badges = {
      super_admin: {
        icon: Crown,
        text: 'مدير رئيسي',
        className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      },
      admin: {
        icon: Shield,
        text: 'مدير',
        className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      },
      manager: {
        icon: User,
        text: 'مشرف',
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      },
    };

    const badge = badges[role as keyof typeof badges] || badges.admin;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="h-3 w-3" />
        {badge.text}
      </span>
    );
  };

  // Status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        <CheckCircle className="h-3 w-3" />
        نشط
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="h-3 w-3" />
        معطل
      </span>
    );
  };

  // Can edit/delete
  const canManage = currentUserRole === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                إدارة المديرين
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                إدارة حسابات المديرين والصلاحيات
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                إضافة مدير جديد
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالبريد أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">كل الأدوار</option>
              <option value="super_admin">مدير رئيسي</option>
              <option value="admin">مدير</option>
              <option value="manager">مشرف</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
            </select>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المديرين', value: admins.length, color: 'from-blue-500 to-cyan-500', icon: Users },
            { label: 'نشط', value: admins.filter(a => a.is_active).length, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
            { label: 'معطل', value: admins.filter(a => !a.is_active).length, color: 'from-red-500 to-orange-500', icon: XCircle },
            { label: 'مدير رئيسي', value: admins.filter(a => a.role === 'super_admin').length, color: 'from-purple-500 to-pink-500', icon: Crown },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Admins Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    الدور
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    آخر تسجيل دخول
                  </th>
                  {canManage && (
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAdmins.map((admin, index) => (
                  <motion.tr
                    key={admin.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {admin.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{admin.email}</span>
                            {admin.id === primaryAdminId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm">
                                <Crown className="h-3 w-3" />
                                حساب أساسي
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {admin.failed_login_attempts && admin.failed_login_attempts > 0 && (
                              <span className="text-red-500">
                                {admin.failed_login_attempts} محاولات فاشلة
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(admin.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(admin.is_active)}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {admin.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm">
                      {admin.last_login ? new Date(admin.last_login).toLocaleString('ar-EG') : 'لم يسجل دخول'}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setFormData({
                                email: admin.email,
                                password: '',
                                confirmPassword: '',
                                role: admin.role,
                                phone: admin.phone || '',
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowPasswordModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="تغيير كلمة المرور"
                          >
                            <Key className="h-4 w-4" />
                          </button>

                          {/* Hide toggle/delete buttons for primary admin */}
                          {admin.id !== primaryAdminId && (
                            <>
                              <button
                                onClick={() => toggleAdminStatus(admin)}
                                className={`p-2 ${admin.is_active ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'} rounded-lg transition-colors`}
                                title={admin.is_active ? 'تعطيل' : 'تفعيل'}
                              >
                                {admin.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </button>

                              <button
                                onClick={() => handleDeleteAdmin(admin)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {/* Show locked indicator for primary admin */}
                          {admin.id === primaryAdminId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 pr-2" title="الحساب الأساسي محمي">
                              🔒 محمي
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredAdmins.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد نتائج</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-purple-500" />
                  إضافة مدير جديد
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.password ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="********"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.password ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">8 أحرف على الأقل</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="********"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الدور *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Admin['role'] })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="admin">مدير</option>
                    <option value="manager">مشرف</option>
                    <option value="super_admin">مدير رئيسي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهاتف (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="05xxxxxxxx"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    إنشاء المدير
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Admin Modal */}
      <AnimatePresence>
        {showEditModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Edit className="h-6 w-6 text-blue-500" />
                    تعديل المدير
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAdmin(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateAdmin} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهاتف (اختياري)
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
                  >
                    حفظ التغييرات
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAdmin(null);
                    }}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Key className="h-6 w-6 text-green-500" />
                    تغيير كلمة المرور
                  </h2>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedAdmin(null);
                      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  تغيير كلمة المرور للمدير: {selectedAdmin.email}
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {currentUserRole === 'super_admin' && selectedAdmin && JSON.parse(localStorage.getItem('admin_user') || '{}').id !== selectedAdmin.id && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      كمدير رئيسي، يمكنك تغيير كلمة مرور أي مدير بدون إدخال كلمة المرور القديمة
                    </p>
                  </div>
                )}

                {selectedAdmin && JSON.parse(localStorage.getItem('admin_user') || '{}').id === selectedAdmin.id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      كلمة المرور القديمة *
                    </label>
                    <div className="relative">
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword.old ? 'text' : 'password'}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        className="w-full pr-10 pl-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        required
                        placeholder="كلمة المرور الحالية"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword.old ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      يجب إدخال كلمة المرور الحالية للتحقق من هويتك
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور الجديدة *
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pr-10 pl-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      required
                      minLength={8}
                      placeholder="كلمة مرور قوية"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password strength indicators */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={passwordData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                        8 أحرف على الأقل
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                        حرف كبير واحد (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full ${/[a-z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={/[a-z]/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                        حرف صغير واحد (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full ${/[0-9]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={/[0-9]/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                        رقم واحد (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                        رمز خاص (!@#$%...)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تأكيد كلمة المرور الجديدة *
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword.confirmNew ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`w-full pr-10 pl-12 py-3 border rounded-xl focus:ring-2 dark:bg-gray-700 dark:text-white ${
                        passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                      }`}
                      required
                      minLength={8}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirmNew: !showPassword.confirmNew })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.confirmNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password match indicator */}
                  {passwordData.confirmPassword && (
                    <div className="mt-2">
                      {passwordData.newPassword === passwordData.confirmPassword ? (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          كلمات المرور متطابقة
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          كلمات المرور غير متطابقة
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting || (passwordData.newPassword !== passwordData.confirmPassword)}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جارِ التغيير...
                      </>
                    ) : (
                      <>
                        <Key className="h-5 w-5" />
                        تغيير كلمة المرور
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedAdmin(null);
                      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
