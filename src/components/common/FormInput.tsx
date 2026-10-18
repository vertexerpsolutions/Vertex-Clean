import React, { forwardRef } from 'react';
import { FormLabel } from './FormLabel';

export type InputVariant = 'default' | 'readonly-code' | 'readonly-highlight';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  error?: string | null;
  helperText?: React.ReactNode;
  containerClassName?: string;
  variant?: InputVariant;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  label,
  required = false,
  optional = false,
  hint,
  icon,
  endIcon,
  error,
  helperText,
  containerClassName = '',
  className = '',
  disabled = false,
  readOnly = false,
  variant = 'default',
  id,
  ...props
}, ref) => {
  const inputId = id || (typeof label === 'string' ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  // Visual styling aligned with StockTransferView.tsx:
  // - Height & padding: px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-bold (~40-42px height)
  // - Dark & Light theme compatibility
  // - State support: regular, readOnly / readonly-code, disabled, and error
  let variantClasses = '';

  if (disabled) {
    variantClasses = 'bg-slate-100 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-70 cursor-not-allowed select-none';
  } else if (readOnly || variant === 'readonly-code') {
    variantClasses = 'bg-blue-50/70 dark:bg-slate-950 border-blue-200 dark:border-blue-900/60 text-[#1565C0] dark:text-blue-400 font-mono font-bold select-all cursor-default';
  } else if (variant === 'readonly-highlight') {
    variantClasses = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 font-mono font-bold select-all cursor-default';
  } else if (error) {
    variantClasses = 'bg-white dark:bg-slate-950 border-rose-500 dark:border-rose-500/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50';
  } else {
    variantClasses = 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 hover:border-slate-400 dark:hover:border-slate-600';
  }

  return (
    <div className={`w-full ${containerClassName}`}>
      {(label || hint) && (
        <FormLabel
          htmlFor={inputId}
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

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          readOnly={readOnly}
          className={`w-full rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold border transition-colors focus:outline-none ${
            icon && !label ? 'pr-9' : ''
          } ${
            endIcon ? 'pl-9' : ''
          } ${variantClasses} ${className}`}
          {...props}
        />

        {endIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-400">
            {endIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-bold text-rose-500 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

FormInput.displayName = 'FormInput';
