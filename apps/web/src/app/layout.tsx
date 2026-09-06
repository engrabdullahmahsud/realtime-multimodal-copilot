'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { AuthProvider } from '@/lib/auth';


function Header() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: 'Conversations', href: '/conversations' },
    { name: 'Documents', href: '/documents' },
    { name: 'Workspaces', href: '/workspaces' },
  ];

  if (!mounted) {
    return <header className="border-b border-strong bg-surface sticky top-0 z-40 h-14" />;
  }

  return (
    <header className="border-b border-strong bg-surface sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-lg text-foreground">
              Copilot
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'text-sm font-medium transition-colors hover:text-accent',
                    pathname === item.href ? 'text-accent' : 'text-muted'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side: theme toggle + user menu */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707.707M21 12h-1M4 12l6.364 6.364M2 12H3m15.364 6.364l-.707-.707M6.343 17.657l-.707-.707" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </Button>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={clsx(
          'min-h-screen bg-background text-foreground flex flex-col',
          isDark && 'dark:bg-surface dark:text-surface',
          mounted && 'transition-colors duration-200'
        )}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}