import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed select-none min-h-[44px]';

  const variantStyles = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-hover active:translate-y-[1px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.3)] focus:ring-primary disabled:bg-neutral-2 disabled:text-muted disabled:shadow-none',
    secondary:
      'bg-surface-alt text-on-primary hover:bg-neutral-3 active:translate-y-[1px] focus:ring-surface-alt disabled:bg-neutral-2 disabled:text-muted',
    outline:
      'bg-transparent text-ink border border-hairline hover:bg-canvas hover:text-primary hover:border-hairline hover:shadow-[0px_4px_25px_rgba(0,0,0,0.1)] focus:ring-primary disabled:border-neutral-2 disabled:text-muted',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-md',
    md: 'text-sm px-6 py-2.5 rounded-md',
    lg: 'text-base px-8 py-3 rounded-md',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
