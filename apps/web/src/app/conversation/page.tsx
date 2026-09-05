'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function ConversationPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Array<{id: string; title: string; messageCount: number}>>([]);
  const [loading, setLoading] = useState(true);
  const { user, refresh } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading conversations...</div>;

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Conversations</h1>
          <Button variant="primary">
            New Conversation
          </Button>
        </div>
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted mb-4">No conversations found. Start a new conversation below.</p>
              <Button variant="primary">New Conversation</Button>
            </Card>
          ) : (
            <ul className="space-y-2">
              {conversations.map((conv) => (
                <li key={conv.id} className="p-3 rounded border hover:bg-muted cursor-pointer hover:underline">
                  <div className="flex items-start">
                    <div className="w-8 rounded bg-muted flex-shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground">{conv.messageCount > 0 ? conv.messageCount : 0}</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium line-clamp-1">{conv.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {conv.messageCount} messages
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}