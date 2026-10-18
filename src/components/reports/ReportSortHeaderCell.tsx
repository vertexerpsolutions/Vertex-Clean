import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface ReportSortHeaderCellProps {
  /** اسم العمود */
  title: string;
  /** المفتاح المعرف لهذا العمود */
  columnKey: string;
  /** المفتاح المفروز حالياً */
  activeSortKey: string | null;
  /** اتجاه الفرز الحالي */
  activeSortDirection?: SortDirection;
  /** دالة التبديل عند الضغط */
  onSort: (key: any) => void;
  /** محاذاة النص والأيقونة */
  align?: 'right' | 'center' | 'left';
  /** أي كلاسات إضافية لخلية th */
  className?: string;
  /** أي عنصر تكميلي داخل العنوان */
  subTitle?: string;
  /** سمة اللون عند التفعيل */
  accentColor?: 'blue' | 'emerald' | 'amber' | 'teal';
}

/**
 * خلية رأس جدول تفاعلية موحدة لفرز التقارير في منصة VERTEX
 * دورة الفرز التفاعلية:
 * 1. الضغطة الأولى: تصاعدي (Ascending)
 * 2. الضغطة الثانية: تنازلي (Descending)
 * 3. الضغطة الثالثة: العودة للترتيب الافتراضي (Default)
 */
export const ReportSortHeaderCell: React.FC<ReportSortHeaderCellProps> = ({
  title,
  columnKey,
  activeSortKey,
  activeSortDirection = null,
  onSort,
  align = 'right',
  className = '',
  subTitle,
  accentColor = 'blue'
}) => {
  const isCurrent = activeSortKey === columnKey && activeSortDirection !== null;
  const isAsc = isCurrent && activeSortDirection === 'asc';
  const isDesc = isCurrent && activeSortDirection === 'desc';

  // Tooltip dynamic text explaining next click state
  const nextActionTooltip = !isCurrent
    ? `اضغط للترتيب تصاعدياً حسب ${title}`
    : isAsc
      ? `اضغط للترتيب تنازلياً حسب ${title}`
      : `اضغط للعودة للترتيب الافتراضي`;

  const alignClasses = align === 'center' 
    ? 'justify-center text-center' 
    : align === 'left' 
      ? 'justify-start text-left' 
      : 'justify-start text-right';

  const colorStyles = {
    blue: {
      activeBadge: 'text-blue-400 bg-blue-500/20 border-blue-400/30',
      activeText: 'text-blue-400',
      activeLight: 'text-[#1565C0]'
    },
    emerald: {
      activeBadge: 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30',
      activeText: 'text-emerald-400',
      activeLight: 'text-emerald-700'
    },
    amber: {
      activeBadge: 'text-amber-400 bg-amber-500/20 border-amber-400/30',
      activeText: 'text-amber-400',
      activeLight: 'text-amber-800'
    },
    teal: {
      activeBadge: 'text-teal-400 bg-teal-500/20 border-teal-400/30',
      activeText: 'text-teal-400',
      activeLight: 'text-teal-700'
    }
  }[accentColor];

  return (
    <th
      onClick={() => onSort(columnKey)}
      title={nextActionTooltip}
      className={`group cursor-pointer select-none transition-all py-2.5 px-3 font-bold ${className} ${
        isCurrent ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      <div className={`inline-flex items-center space-x-1.5 space-x-reverse w-full ${alignClasses}`}>
        <span className="truncate">
          {title}
          {subTitle && <span className="text-[10px] font-normal opacity-75 mr-1">{subTitle}</span>}
        </span>

        {/* المؤشر البصري للفرز: تصاعدي / تنازلي / محايد */}
        <span className="shrink-0 inline-flex items-center justify-center transition-all duration-150">
          {isAsc ? (
            <span className={`inline-flex items-center justify-center p-0.5 rounded border text-xs font-bold animate-in fade-in zoom-in-90 ${colorStyles.activeBadge}`}>
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          ) : isDesc ? (
            <span className={`inline-flex items-center justify-center p-0.5 rounded border text-xs font-bold animate-in fade-in zoom-in-90 ${colorStyles.activeBadge}`}>
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          ) : (
            <span className="opacity-30 group-hover:opacity-80 transition-opacity p-0.5">
              <ArrowUpDown className="w-3 h-3 text-current" />
            </span>
          )}
        </span>
      </div>
    </th>
  );
};
