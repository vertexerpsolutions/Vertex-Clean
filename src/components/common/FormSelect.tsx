import React, { forwardRef } from 'react';
import { FormLabel } from './FormLabel';
import { ChevronDown } from 'lucide-react';

export interface FormSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  error?: string | null;
  helperText?: React.ReactNode;
  containerClassName?: string;
  options?: FormSelectOption[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(({
  label,
  required = false,
  optional = false,
  hint,
  icon,
  error,
  helperText,
  containerClassName = '',
  className = '',
  disabled = false,
  options,
  placeholder,
  children,
  id,
  ...props
}, ref) => {
  const selectId = id || (typeof label === 'string' ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  // Visual styling aligned with StockTransferView.tsx:
  // - Height & padding: px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-bold (~40-42px height)
  // - RTL arrow positioning (left-3)
  // - Theme support: dark & light
  let variantClasses = '';

  if (disabled) {
    variantClasses = 'bg-slate-100 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-70 cursor-not-allowed select-none';
  } else if (error) {
    variantClasses = 'bg-white dark:bg-slate-950 border-rose-500 dark:border-rose-500/80 text-slate-800 dark:text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 cursor-pointer';
  } else {
    variantClasses = 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer';
  }

  return (
    <div className={`w-full ${containerClassName}`}>
      {(label || hint) && (
        <FormLabel
          htmlFor={selectId}
          label={label}
          required={required}
          optional={optional}
          hint={hint}
          icon={icon}
        />
      )}

      <div className="relative flex items-center">
        {icon && !label && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-400">
            {icon}
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold border transition-colors focus:outline-none appearance-none pl-9 ${
            icon && !label ? 'pr-9' : ''
          } ${variantClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400">
              {placeholder}
            </option>
          )}

          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom Chevron icon aligned for RTL layout */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-bold text-rose-500 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';
