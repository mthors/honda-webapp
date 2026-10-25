import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'neutral' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    neutral: 'bg-neutral-2 text-body border border-hairline',
    success: 'bg-green-50 text-status-success border border-green-200',
    warning: 'bg-amber-50 text-status-warning border border-amber-200',
    error: 'bg-red-50 text-status-error border border-red-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center tracking-wide uppercase rounded-xs ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
