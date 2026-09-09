'use client';

import { useEffect, useState, useRef } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  workspaceId: string;
}

interface MessageContent {
  type: 'text';
  text: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  createdAt: string;
}

interface ConversationsResponse {
  items: Conversation[];
}

interface MessagesResponse {
  items: Message[];
}

export default function ConversationPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/conversations', {
          credentials: 'include',
        });
        const data: ConversationsResponse = await res.json();
        setConversations(data.items ?? []);
        setError(null);
      } catch {
        setError('Failed to load conversations.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSelectConversation = async (id: string) => {
    setSelectedConversation(id);
    setMessagesLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${id}/messages`, {
        credentials: 'include',
      });
      const data: MessagesResponse = await res.json();
      setMessages(data.items ?? []);
    } catch {
      setError('Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newTitle.trim()) {
      setError('Title is required.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workspaceId: '00000000-0000-0000-0000-000000000000', title: newTitle.trim() }),
      });
      const data = await res.json();
      const newConv = data.conversation;
      if (newConv) {
        setConversations((prev) => [{ ...newConv, messageCount: 0 }, ...prev]);
        setSelectedConversation(newConv.id);
        void handleSelectConversation(newConv.id);
      }
      setNewTitle('');
    } catch {
      setError('Failed to create conversation.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!selectedConversation || !newTitle.trim()) {
      return;
    }

    const message = newTitle.trim();
    setSending(true);
    setError(null);

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: [{ type: 'text', text: message }],
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setNewTitle('');

    try {
      const res = await fetch('/api/ai/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId: selectedConversation, message }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message.');
      }

      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => !m.id.startsWith('temp-'));
          return [...withoutTemp, ...data.messages];
        });
      }
    } catch {
      setError('Failed to send message.');
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading conversations...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex h-screen">
        <div className="w-80 border-r p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Conversations</h1>
            <Button variant="primary" size="sm" onClick={() => { void handleCreateConversation(); }}>
              New
            </Button>
          </div>

          {error && (
            <Card className="p-3 mb-3 border-danger text-danger text-sm">
              {error}
            </Card>
          )}

          <div className="space-y-2">
            {conversations.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-muted text-sm">No conversations yet.</p>
              </Card>
            ) : (
              conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                    selectedConversation === conv.id ? 'bg-muted border-accent' : ''
                  }`}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => { void handleSelectConversation(conv.id); }}
                  >
                    <h3 className="font-medium text-sm line-clamp-1">{conv.title}</h3>
                    <p className="text-xs text-muted mt-1">{conv.messageCount} messages</p>
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesLoading && (
                  <div className="flex items-center justify-center p-4">
                    <p>Loading messages...</p>
                  </div>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <Card className="p-6 text-center">
                      <p className="text-muted">No messages yet. Start a conversation below.</p>
                    </Card>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-accent text-white'
                          : 'bg-surface border border-strong'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content.map((c, i) => (
                          <span key={i}>{c.text}</span>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-strong rounded-lg p-3">
                      <p className="text-sm text-muted">Typing...</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4">
                {error && (
                  <Card className="p-2 mb-2 border-danger text-danger text-xs">
                    {error}
                  </Card>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newTitle}
                    onChange={(e) => { setNewTitle(e.target.value); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    disabled={sending}
                    className="flex-1 px-3 py-2 border border-strong rounded-md bg-surface text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                  <Button
                    variant="primary"
                    size="md"
                    disabled={sending || !newTitle.trim()}
                    onClick={() => { void handleSend(); }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="p-6 text-center">
                <h2 className="text-lg font-medium mb-2">Select a conversation</h2>
                <p className="text-muted text-sm">Choose a conversation from the left panel or create a new one.</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
