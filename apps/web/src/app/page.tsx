'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch workspaces if authenticated
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetch('/api/workspaces')
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data.workspaces ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  if (authLoading) {return <div className="p-6">Loading...</div>;}

  return (
    <div className="p-6 max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Real-Time Multimodal Copilot</h1>
      <p className="text-muted-foreground mb-6">Welcome to your AI workspace</p>
      
      {!user ? (
        <div className="space-y-4">
          <p className="text-muted">Sign in to access your workspaces and conversations.</p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="btn-primary">Sign in</Link>
            <Link href="/auth/register" className="btn-secondary">Create account</Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h2>Workspaces</h2>
            {loading ? <p>Loading workspaces...</p> : (
              <ul className="space-y-2">
                {workspaces.map((ws) => (
                  <li key={ws.id} className="p-2 rounded hover:bg-muted">
                    <Link href={`/workspaces/${ws.id}`} className="text-primary hover:underline">
                      {ws.name}
                    </Link>
                  </li>
                ))}
                {workspaces.length === 0 && (
                  <li className="p-2 rounded bg-muted text-muted">No workspaces yet</li>
                )}
              </ul>
            )}
          </div>
          
          <div className="flex gap-4">
            <Link href="/conversations" className="btn-primary">View Conversations</Link>
            <Link href="/workspaces" className="btn-secondary">Manage Workspaces</Link>
            <Link href="/documents" className="btn-secondary">Documents</Link>
          </div>
        </div>
      )}
    </div>
  );
}