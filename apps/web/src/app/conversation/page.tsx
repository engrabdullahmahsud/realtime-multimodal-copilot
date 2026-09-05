import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function ConversationPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Array<{id: string; title: string; messageCount: number}>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching conversations:', err);
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive',
        });
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading conversations...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Conversations</h1>
      <div className="space-y-4">
        {conversations.length === 0 ? (
          <p className="text-muted-foreground">No conversations found. Start a new conversation below.</p>
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
                    <p className="text-sm text-muted-fline-clamp-1">
                      {conv.messageCount} messages
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <a href="/conversation/new" className="btn-primary">
            New Conversation
          </a>
        </div>
      </div>
    </div>
  );
}
