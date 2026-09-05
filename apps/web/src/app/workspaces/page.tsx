'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    fetch('/api/workspaces')
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data.workspaces || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading workspaces...</div>;

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <Button variant="primary">Create Workspace</Button>
        </div>
        <div className="space-y-4">
          {workspaces.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted mb-4">No workspaces found</p>
              <Button variant="primary">Create Workspace</Button>
            </Card>
          ) : (
            <ul className="space-y-2">
              {workspaces.map((ws) => (
                <li key={ws.id} className="p-4 border rounded">
                  <h3 className="font-medium">{ws.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {ws.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}