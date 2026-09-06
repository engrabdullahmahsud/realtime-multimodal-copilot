'use client';

import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [open]);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  if (!user) {return null;}

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="ghost" size="sm" onClick={() => { setOpen(!open); }} className="gap-2">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block">{user.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 z-50">
          <Card className="p-2">
            <div className="px-3 py-2 border-b border-strong">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}