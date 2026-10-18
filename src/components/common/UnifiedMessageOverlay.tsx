import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type UnifiedMessageType = 'error' | 'success' | 'warning' | 'info';

interface UnifiedMessageOverlayProps {
  message: string | null;
  type?: UnifiedMessageType;
  duration?: number;
  onClose?: () => void;
}

export function detectMessageType(msg: string): UnifiedMessageType {
  const lower = msg.toLowerCase();
  if (
    msg.includes('خطأ') ||
    msg.includes('فشل') ||
    msg.includes('رفض') ||
    msg.includes('لا يمكن') ||
    msg.includes('لا تملك') ||
    msg.includes('لا يملك') ||
    msg.includes('غير متاح') ||
    msg.includes('غير صالح') ||
    msg.includes('غير مكتمل') ||
    msg.includes('غير صحيح') ||
    msg.includes('تجاوز') ||
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('invalid') ||
    lower.includes('denied')
  ) {
    return 'error';
  }

  if (
    msg.includes('تنبيه') ||
    msg.includes('تحذير') ||
    msg.includes('محمي') ||
    msg.includes('غير محفوظة') ||
    lower.includes('warning') ||
    lower.includes('alert')
  ) {
    return 'warning';
  }

  if (
    msg.includes('تم') ||
    msg.includes('نجاح') ||
    msg.includes('حفظ') ||
    msg.includes('تعديل') ||
    msg.includes('إضافة') ||
    msg.includes('حذف') ||
    lower.includes('success') ||
    lower.includes('completed') ||
    lower.includes('saved')
  ) {
    return 'success';
  }

  return 'info';
}

export const UnifiedMessageOverlay: React.FC<UnifiedMessageOverlayProps> = ({
  message,
  type,
  duration,
  onClose
}) => {
  const resolvedType = type || (message ? detectMessageType(message) : 'info');
  const resolvedDuration = duration !== undefined ? duration : 1000;

  useEffect(() => {
    if (message && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, resolvedDuration);
      return () => clearTimeout(timer);
    }
  }, [message, resolvedDuration, onClose]);

  if (!message) return null;

  const typeStyles = {
    error: {
      border: 'border-rose-500',
      bgIcon: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
      text: 'text-rose-100',
      icon: <AlertTriangle className="w-6 h-6 text-rose-400" />
    },
    success: {
      border: 'border-emerald-500',
      bgIcon: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      text: 'text-emerald-100',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />
    },
    warning: {
      border: 'border-amber-500',
      bgIcon: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      text: 'text-amber-100',
      icon: <AlertCircle className="w-6 h-6 text-amber-400" />
    },
    info: {
      border: 'border-sky-500',
      bgIcon: 'bg-sky-500/20 border-sky-500/40 text-sky-400',
      text: 'text-sky-100',
      icon: <Info className="w-6 h-6 text-sky-400" />
    }
  };

  const style = typeStyles[resolvedType] || typeStyles.info;

  return (
    <div
      id="unified-message-overlay"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999
      }}
      className={`px-6 py-4 rounded-2xl bg-slate-900/95 border-2 ${style.border} ${style.text} shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center space-x-3.5 space-x-reverse min-w-[320px] max-w-lg animate-in fade-in zoom-in-95 duration-150 no-print`}
      dir="rtl"
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.bgIcon}`}>
        {style.icon}
      </div>
      <div className="text-right flex-1">
        <div className="font-bold text-sm leading-snug">{message}</div>
      </div>
    </div>
  );
};
