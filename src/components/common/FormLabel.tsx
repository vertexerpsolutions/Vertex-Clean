import React from 'react';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  optional = false,
  hint,
  icon,
  className = '',
  children,
  ...props
}) => {
  const content = label || children;
  if (!content && !hint) return null;

  return (
    <div className="flex items-center justify-between mb-1.5 select-none">
      <label
        className={`block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 space-x-reverse ${className}`}
        {...props}
      >
        {icon && <span className="inline-flex shrink-0 text-slate-400 dark:text-slate-400">{icon}</span>}
        {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
        <span>{content}</span>
        {optional && (
          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mr-1">
            (اختياري)
          </span>
        )}
      </label>
      {hint && (
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
          {hint}
        </span>
      )}
    </div>
  );
};
