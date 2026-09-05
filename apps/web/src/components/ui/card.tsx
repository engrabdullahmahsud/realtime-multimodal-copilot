'use client';

import { useTheme } from '@/hooks/useTheme';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  borderRadius?: string;
}

export function Card({ 
  children, 
  className = '', 
  title, 
  subtitle, 
  borderRadius = 'DEFAULT' 
}: CardProps) {
  const { isDark, themeMode } = useTheme();
  
  const baseClasses = 'bg-surface rounded-md border border-strong shadow-sm dark:border-strong';
  const titleClasses = 'text-foreground text-sm font-medium';
  const subtitleClasses = 'text-muted text-sm';
  
  const classes = clsx(
    'rounded-md border border-strong shadow-sm',
    'bg-surface',
    'dark:bg-surface',
    'dark:border-strong',
    'hover:shadow-md',
    'transition-shadow',
    className,
    title && subtitle && 'mb-3'
  );
  
  return (
    <div className={classes}>
      {title && <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      {children}
    </div>
  );
}