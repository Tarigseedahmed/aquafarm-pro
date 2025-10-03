'use client';

import React from 'react';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'warning' | 'destructive' | 'success' | 'info';
};

export const Alert: React.FC<AlertProps> = ({
  className = '',
  variant = 'default',
  ...props
}) => {
  const base = 'w-full rounded-lg border p-4 text-sm';
  const variants: Record<NonNullable<AlertProps['variant']>, string> = {
    default: 'bg-card border-border text-foreground',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
  };
  return <div className={`${base} ${variants[variant]} ${className}`} {...props} />;
};

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  ...props
}) => {
  return <p className={`mt-1 leading-relaxed ${className}`} {...props} />;
};

export default Alert;


