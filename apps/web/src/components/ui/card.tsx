'use client';

import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({
  children,
  className = '',
  title,
  subtitle,
}: CardProps) {
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
      {title && (
        <h3 className="text-sm font-medium text-foreground mb-1">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm text-muted">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
