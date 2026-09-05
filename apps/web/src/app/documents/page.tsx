'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading documents...</div>;

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Documents</h1>
          <Button variant="primary">Upload Document</Button>
        </div>
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted mb-4">No documents found</p>
              <Button variant="primary">Upload Document</Button>
            </Card>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="p-4 border rounded">
                  <h3 className="font-medium">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {doc.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}