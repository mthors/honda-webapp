import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'canvas' | 'neutral' | 'dark';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'canvas',
  padding = 'md',
  bordered = true,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    canvas: 'bg-canvas text-ink',
    neutral: 'bg-[#FAFAFA] text-ink',
    dark: 'bg-surface-alt text-on-primary',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const borderStyle = bordered
    ? variant === 'dark'
      ? 'border border-neutral-3'
      : 'border border-hairline'
    : '';

  // Sharp corners as specified in DESIGN.md (rounded-none / 0px)
  return (
    <div
      className={`rounded-none ${variantStyles[variant]} ${paddingStyles[padding]} ${borderStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

