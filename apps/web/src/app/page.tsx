'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {!user ? (
        <section className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-4xl font-bold mb-4">Real-Time Multimodal Copilot</h1>
          <p className="text-muted-foreground mb-8 text-lg">Your AI-powered workspace for collaborative multimodal experiences</p>
          <div className="flex gap-4">
            <Link href="/auth/register">
              <Button variant="primary">Get Started</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </div>
        </section>
      ) : (
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground mb-8">{user.email}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Workspaces" subtitle="Manage your workspaces">
              <Link href="/workspaces">
                <Button variant="outline">Go to Workspaces</Button>
              </Link>
            </Card>
            <Card title="Documents" subtitle="Your documents">
              <Link href="/documents">
                <Button variant="outline">View Documents</Button>
              </Link>
            </Card>
            <Card title="Conversations" subtitle="Your conversations">
              <Link href="/conversation">
                <Button variant="outline">View Conversations</Button>
              </Link>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
