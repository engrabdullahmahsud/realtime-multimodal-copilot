'use client';

import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  onClick,
  ...props
}: ButtonProps) {
  
  const baseClasses = 'font-medium transition-all duration-200 focus-visible:outline-none';
  const variantClasses = {
    primary: 'bg-accent text-white hover:bg-accent-600',
    secondary: 'bg-surface text-surface hover:bg-surface-700',
    outline: 'border border-strong text-foreground hover:bg-surface-700',
    ghost: 'text-foreground hover:bg-surface-50',
    destructive: 'bg-danger text-white hover:bg-danger-600',
  };
  
  const sizeClasses = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-5 py-2',
  };
  
  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
    'rounded-md focus-visible:outline-none',
    'hover:shadow-sm',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    'active:shadow-sm active:scale-[95%] active:bg-accent-700'
  );
  
  return (
    <button 
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}