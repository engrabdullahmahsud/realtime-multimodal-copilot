'use client';

import { useTheme } from '@/hooks/useTheme';

export interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InputGroup({
  children,
  className = '',
  size = 'md',
}: InputGroupProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1' : size === 'lg' ? 'px-5 py-2' : 'px-3.5 py-1.5';

  const classes = `w-full rounded-md border border-strong ${sizeClasses} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
}