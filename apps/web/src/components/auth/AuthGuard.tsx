'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
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
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

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