import React from 'react';

interface GoldCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GoldCard: React.FC<GoldCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 ${
        hoverable ? 'hover:border-amber-500/50 hover:bg-slate-900/80 cursor-pointer transition-all' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
