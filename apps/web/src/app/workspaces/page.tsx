'use client';

import { useEffect, useState } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creatingError, setCreatingError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWorkspaces = () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch('/api/workspaces', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch workspaces');
        }
        return res.json();
      })
      .then((data) => {
        setWorkspaces(data.workspaces ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load workspaces');
        setLoading(false);
      });
  };

  useEffect(() => {
    void fetchWorkspaces();
  }, [user]);

  const generateSlug = (value: string): string => {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setCreatingError('Name is required');
      return;
    }
    const slug = generateSlug(name);
    setCreating(true);
    setCreatingError(null);
    fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim(), slug, description: description.trim() }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to create workspace');
        }
        return res.json();
      })
      .then(() => {
        setName('');
        setDescription('');
        void fetchWorkspaces();
      })
      .catch(() => {
        setCreatingError('Failed to create workspace');
        setCreating(false);
      });
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="p-6">Loading workspaces...</div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="p-6">
          <Card className="p-6 text-center">
            <p className="text-muted mb-4">{error}</p>
            <Button variant="primary" onClick={() => { void fetchWorkspaces(); }}>Retry</Button>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <Button variant="primary" onClick={() => { void handleCreate(); }}>Create Workspace</Button>
        </div>

        <div className="space-y-4">
          {workspaces.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted mb-4">No workspaces found</p>
              <Button variant="primary" onClick={() => { void fetchWorkspaces(); }}>Create Workspace</Button>
            </Card>
          ) : (
            <ul className="space-y-2">
              {workspaces.map((ws) => (
                <li key={ws.id} className="p-4 border rounded">
                  <h3 className="font-medium">{ws.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {ws.id}</p>
                  <p className="text-sm text-muted-foreground">Role: {ws.role}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Workspace</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setCreatingError(null); }}
                className="w-full px-3 py-2 border rounded-md bg-surface text-foreground"
                placeholder="My Workspace"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setCreatingError(null); }}
                className="w-full px-3 py-2 border rounded-md bg-surface text-foreground"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Generated Slug</label>
              <input
                type="text"
                value={generateSlug(name) || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground"
              />
            </div>
            {creatingError && (
              <p className="text-sm text-red-500">{creatingError}</p>
            )}
            <Button
              variant="primary"
              disabled={creating}
              onClick={() => { void handleCreate(); }}
            >
              {creating ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </Card>
      </div>
    </AuthGuard>
  );
}
