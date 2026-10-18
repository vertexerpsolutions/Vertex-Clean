import React from 'react';

interface GoldToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const GoldToolbar: React.FC<GoldToolbarProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md ${className}`}
    >
      {children}
    </div>
  );
};
