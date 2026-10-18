import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Sliders,
  DollarSign
} from 'lucide-react';

interface UserRoleRecord {
  id: string;
  name: string;
  role: string;
  roleTitle: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  sensitivePermissions: {
    canDeleteData: boolean;
    canModifyCodes: boolean;
    canResetItems: boolean;
    canViewProfitability: boolean;
    canManageUsers: boolean;
    canExecuteFiscalLock: boolean;
    canEditSensitiveSettings: boolean;
  };
}

export const UsersPermissionsView: React.FC<{ onClose: (dirty?: boolean) => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<UserRoleRecord[]>([
    {
      id: 'USR-01',
      name: 'مدير النظام (Super Admin)',
      role: 'super_admin',
      roleTitle: 'مدير النظام العام',
      status: 'active',
      lastLogin: 'اليوم، 10:45 ص',
      sensitivePermissions: {
        canDeleteData: true,
        canModifyCodes: true,
        canResetItems: true,
        canViewProfitability: true,
        canManageUsers: true,
        canExecuteFiscalLock: true,
        canEditSensitiveSettings: true
      }
    },
    {
      id: 'USR-02',
      name: 'محاسب الفرع الرئيسي',
      role: 'accountant',
      roleTitle: 'رئيس الحسابات',
      status: 'active',
      lastLogin: 'أمس، 04:20 م',
      sensitivePermissions: {
        canDeleteData: false,
        canModifyCodes: false,
        canResetItems: false,
        canViewProfitability: true,
        canManageUsers: false,
        canExecuteFiscalLock: false,
        canEditSensitiveSettings: false
      }
    },
    {
      id: 'USR-03',
      name: 'كاشير مبيعات المعرض',
      role: 'cashier',
      roleTitle: 'مسؤول نقطة البيع',
      status: 'active',
      lastLogin: 'اليوم، 09:12 ص',
      sensitivePermissions: {
        canDeleteData: false,
        canModifyCodes: false,
        canResetItems: false,
        canViewProfitability: false, // Hidden for regular cashiers
        canManageUsers: false,
        canExecuteFiscalLock: false,
        canEditSensitiveSettings: false
      }
    }
  ]);

  const [selectedUser, setSelectedUser] = useState<UserRoleRecord | null>(users[0]);
  const [isDirty, setIsDirty] = useState(false);

  const togglePermission = (permKey: keyof UserRoleRecord['sensitivePermissions']) => {
    if (!selectedUser) return;
    if (selectedUser.role === 'super_admin' && permKey === 'canManageUsers') {
      return; // Cannot revoke super admin core permission
    }

    const updated = {
      ...selectedUser,
      sensitivePermissions: {
        ...selectedUser.sensitivePermissions,
        [permKey]: !selectedUser.sensitivePermissions[permKey]
      }
    };

    setSelectedUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setIsDirty(true);
  };

  return (
    <div id="users-permissions-screen" className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden select-none" dir="rtl">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h2 className="text-base sm:text-lg font-black text-slate-100">المستخدمون والصلاحيات</h2>
              <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                RBAC & Security
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة حسابات النظام وتوزيع الصلاحيات الحساسة للأدوار المختلفة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onClose(isDirty)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer flex items-center space-x-1.5 space-x-reverse"
        >
          <span>إغلاق الشاشة</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Grid */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900">
        {/* Users List Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200">المستخدمون النشطون ({users.length})</span>
            <button type="button" className="text-xs text-purple-400 font-bold hover:text-purple-300 flex items-center space-x-1 space-x-reverse">
              <Plus className="w-3.5 h-3.5" />
              <span>مستخدم جديد</span>
            </button>
          </div>

          <div className="space-y-2">
            {users.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className={`w-full p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-900/20'
                      : 'bg-slate-950/80 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{u.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {u.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span>{u.roleTitle}</span>
                    <span className="text-emerald-400 font-bold">{u.status === 'active' ? '● نشط' : '○ متوقف'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected User Permissions Details */}
        {selectedUser && (
          <div className="md:col-span-2 p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedUser.name}</h3>
                <span className="text-xs text-slate-400">{selectedUser.roleTitle}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">آخر تسجيل دخول: {selectedUser.lastLogin}</span>
            </div>

            {/* Sensitive Permissions Switchboard */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-2 space-x-reverse">
                <Lock className="w-4 h-4" />
                <span>الصلاحيات الحساسة (Strict Sensitive Permissions)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'canDeleteData' as const, title: 'حذف البيانات والسجلات', desc: 'صلاحية حذف الفواتير والمخازن والعملاء' },
                  { key: 'canModifyCodes' as const, title: 'تعديل الأكواد والمعرفات', desc: 'تعديل أكواد الأصناف والمخازن اليدوية' },
                  { key: 'canResetItems' as const, title: 'إعادة ضبط الأصناف والمخزون', desc: 'تصفير الأرصدة وتعديل التكلفة التاريخية' },
                  { key: 'canViewProfitability' as const, title: 'عرض ربحية الفواتير', desc: 'مشاهدة هوامش الربح وآخر سعر شراء' },
                  { key: 'canManageUsers' as const, title: 'إدارة المستخدمين والصلاحيات', desc: 'إنشاء حسابات وتعيين كلمات المرور' },
                  { key: 'canExecuteFiscalLock' as const, title: 'الإقفال المالي والسنوي', desc: 'إغلاق الفترات المحاسبية وتجميد القيود' },
                  { key: 'canEditSensitiveSettings' as const, title: 'إعدادات النظام الحساسة', desc: 'تعديل سياسات الأمان وقواعد البيانات' }
                ].map((perm) => {
                  const hasPerm = selectedUser.sensitivePermissions[perm.key];
                  return (
                    <div
                      key={perm.key}
                      onClick={() => togglePermission(perm.key)}
                      className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                        hasPerm 
                          ? 'bg-purple-950/20 border-purple-500/40 text-slate-200' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold">{perm.title}</div>
                        <div className="text-[10px] text-slate-500">{perm.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        hasPerm ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {hasPerm ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
