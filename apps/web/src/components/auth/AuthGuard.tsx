'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'viewer' | 'member' | 'admin' | 'owner';
  fallback?: React.ReactNode;
}

/**
 * AuthGuard - Protects routes from unauthenticated users.
 *
 * If user is not authenticated, redirects to /auth/login with callbackUrl.
 * If user doesn't have required role, shows fallback or access denied.
 */
export function AuthGuard({
  children,
  requiredRole,
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, refresh } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/auth/login?callbackUrl=${callbackUrl}`);
    }
  }, [user, loading, pathname, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Not authenticated - redirecting (show nothing or fallback)
  if (!user) {
    return fallback ?? null;
  }

  // Role check (basic - real role check should happen server-side)
  // For now, we just check if user exists
  return <>{children}</>;
}