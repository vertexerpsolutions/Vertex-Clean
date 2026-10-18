import React from 'react';

export interface ReportMetadataItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  isMono?: boolean;
  highlight?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate' | 'rose';
}

export interface VertexReportHeaderProps {
  /** اسم الشركة - Bold + Center */
  companyName?: string;
  /** وصف نظام الإدارة والفرع التابع - Center */
  systemSubtitle?: string;
  branchName?: string;
  /** عنوان التقرير الرئيسي - Bold + Center + أكبر حجم */
  reportTitle: string;
  /** العنوان الفرعي / وصف نوع التقرير - Bold + Center */
  reportSubtitle?: string;
  /** وصف نطاق التقرير الإضافي (اختياري) - Center */
  scopeDescription?: string;
  /** البيانات التعريفية: تنسيق واضح وموحد (تاريخ، عدد أصناف، إجماليات، إلخ) */
  metadataItems?: ReportMetadataItem[];
  /** كادر اختياري إضافي لمحتوى نطاق التقرير التخصصي */
  children?: React.ReactNode;
  /** لون السمة الرئيسي */
  themeColor?: 'blue' | 'teal' | 'purple' | 'emerald' | 'slate';
  /** هل التقرير مخصص للطباعة / التصدير الورقي */
  isPrintVersion?: boolean;
  isDark?: boolean;
  className?: string;
  id?: string;
}

export const VertexReportHeader: React.FC<VertexReportHeaderProps> = ({
  companyName = 'شركة الندى للمستلزمات الطبية والتوريدات',
  systemSubtitle,
  branchName,
  reportTitle,
  reportSubtitle,
  scopeDescription,
  metadataItems = [],
  children,
  themeColor = 'blue',
  isPrintVersion = false,
  isDark = false,
  className = '',
  id
}) => {
  const displaySubtitle = systemSubtitle || (
    branchName 
      ? `نظام إدارة المخازن والمستودعات — الفرع: ${branchName}`
      : 'نظام إدارة المخازن والمستودعات — منصة فيرتكس ERP'
  );

  // Theme color maps for subtitle & accents
  const themeClasses = {
    blue: {
      subtitle: isDark ? 'text-blue-400' : 'text-[#1565C0]',
      boxBorder: isDark ? 'border-blue-900/60' : 'border-blue-200',
      badgeBg: isDark ? 'bg-blue-950/40 text-blue-300' : 'bg-blue-50 text-blue-800'
    },
    teal: {
      subtitle: isDark ? 'text-teal-400' : 'text-teal-700',
      boxBorder: isDark ? 'border-teal-900/60' : 'border-teal-200',
      badgeBg: isDark ? 'bg-teal-950/40 text-teal-300' : 'bg-teal-50 text-teal-800'
    },
    purple: {
      subtitle: isDark ? 'text-purple-400' : 'text-purple-700',
      boxBorder: isDark ? 'border-purple-900/60' : 'border-purple-200',
      badgeBg: isDark ? 'bg-purple-950/40 text-purple-300' : 'bg-purple-50 text-purple-800'
    },
    emerald: {
      subtitle: isDark ? 'text-emerald-400' : 'text-emerald-700',
      boxBorder: isDark ? 'border-emerald-900/60' : 'border-emerald-200',
      badgeBg: isDark ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
    },
    slate: {
      subtitle: isDark ? 'text-slate-300' : 'text-slate-700',
      boxBorder: isDark ? 'border-slate-800' : 'border-slate-200',
      badgeBg: isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
    }
  }[themeColor];

  return (
    <div 
      id={id}
      dir="rtl"
      lang="ar"
      className={`vertex-report-header w-full select-text transition-colors mb-4 ${className}`}
      style={{
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
        letterSpacing: '0px'
      }}
    >
      {/* 1. اسم الشركة: Bold + Center */}
      <div className="text-center">
        <h2 
          className={`font-black tracking-normal leading-tight ${
            isPrintVersion 
              ? 'text-lg text-slate-900' 
              : isDark ? 'text-base sm:text-lg text-white' : 'text-base sm:text-lg text-slate-900'
          }`}
          style={{ letterSpacing: '0px' }}
        >
          {companyName}
        </h2>

        {/* وصف النظام والفرع التابع */}
        {displaySubtitle && (
          <p 
            className={`text-xs mt-0.5 tracking-normal font-semibold ${
              isPrintVersion 
                ? 'text-slate-600' 
                : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
            style={{ letterSpacing: '0px' }}
          >
            {displaySubtitle}
          </p>
        )}
      </div>

      {/* خط فاصل أنيق تحت ترويسة الشركة */}
      <div 
        className={`my-3 border-b-2 ${
          isPrintVersion 
            ? 'border-slate-800' 
            : isDark ? 'border-slate-700' : 'border-slate-200'
        }`} 
      />

      {/* 2. عنوان التقرير الرئيسي: Bold + Center + أكبر حجم */}
      <div className="text-center py-1">
        <h1 
          className={`font-black tracking-normal leading-tight ${
            isPrintVersion 
              ? 'text-xl text-slate-900' 
              : isDark ? 'text-xl sm:text-2xl text-slate-100' : 'text-xl sm:text-2xl text-slate-900'
          }`}
          style={{ letterSpacing: '0px' }}
        >
          {reportTitle}
        </h1>

        {/* 3. العنوان الفرعي/وصف نطاق التقرير: Bold + Center */}
        {reportSubtitle && (
          <p 
            className={`font-bold mt-1 tracking-normal text-xs sm:text-sm ${themeClasses.subtitle}`}
            style={{ letterSpacing: '0px' }}
          >
            {reportSubtitle}
          </p>
        )}

        {scopeDescription && (
          <p 
            className={`text-xs mt-0.5 tracking-normal font-semibold ${
              isPrintVersion 
                ? 'text-slate-700' 
                : isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
            style={{ letterSpacing: '0px' }}
          >
            {scopeDescription}
          </p>
        )}
      </div>

      {/* 4. البيانات التعريفية: تنسيق واضح وموحد */}
      {metadataItems.length > 0 && (
        <div 
          className={`mt-3.5 p-2.5 sm:p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2.5 text-xs ${
            isPrintVersion
              ? 'bg-slate-50 border-slate-300 text-slate-900'
              : isDark 
                ? 'bg-slate-850/80 border-slate-700 text-slate-200' 
                : 'bg-slate-50/90 border-slate-200 text-slate-800'
          }`}
          style={{ letterSpacing: '0px' }}
        >
          {metadataItems.map((meta, idx) => {
            const highlightClasses = {
              emerald: isDark ? 'text-emerald-400' : 'text-emerald-700',
              blue: isDark ? 'text-blue-400' : 'text-blue-700',
              amber: isDark ? 'text-amber-400' : 'text-amber-700',
              purple: isDark ? 'text-purple-400' : 'text-purple-700',
              rose: isDark ? 'text-rose-400' : 'text-rose-700',
              slate: isDark ? 'text-slate-200' : 'text-slate-800'
            }[meta.highlight || 'slate'];

            return (
              <div 
                key={`report-meta-${idx}`} 
                className="flex items-center space-x-1.5 space-x-reverse"
              >
                {meta.icon && <span className="opacity-75">{meta.icon}</span>}
                <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {meta.label}:
                </span>
                <span 
                  className={`font-bold ${meta.isMono ? 'font-mono' : ''} ${highlightClasses}`}
                >
                  {meta.value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Children: مثل البرواز المتخصص بنطاق التقرير (إذا وُجد) */}
      {children && (
        <div className="mt-3.5">
          {children}
        </div>
      )}
    </div>
  );
};
