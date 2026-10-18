import React, { useState, useEffect } from 'react';
import { X, Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { notificationEngine } from '../services/notificationEngine';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = notificationEngine.subscribe((items) => {
      setNotifications(items);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default: return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">محرك الإشعارات</h3>
              <p className="text-[11px] text-slate-400">موجز موزع أحداث النظام</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{notifications.length} إجمالي سجلات التوزيع</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => notificationEngine.markAllAsRead()}
              className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>تحديد الكل كقراءة</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => notificationEngine.clearAll()}
              className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              لا توجد إشعارات مُرسلة بعد.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => notificationEngine.markAsRead(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-400 opacity-80'
                    : 'bg-slate-800/80 border-indigo-500/30 text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between space-x-2">
                  <div className="flex items-start space-x-2.5">
                    {getTypeIcon(item.type)}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100 leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Engine: {item.sourceEngine}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
