import React from 'react';

interface GoldLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const GoldLayout: React.FC<GoldLayoutProps> = ({ children, className = '' }) => {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
};
