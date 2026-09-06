'use client';

import { useTheme } from '@/hooks/useTheme';
import { SunIcon } from '@/icons/sun';

export function ThemeToggle() {
  const { toggleTheme } = useTheme();
  
  return (
    <div className="flex items-center space-x-2">
      <button 
        onClick={toggleTheme}
        className="flex items-center w-8 h-8 rounded-full bg-surface text-foreground hover:bg-surface-700 dark:bg-surface-700 dark:text-surface transition-colors"
        aria-label="Toggle theme"
      >
        <SunIcon className="w-5 h-5" />
      </button>
    </div>
  );
}