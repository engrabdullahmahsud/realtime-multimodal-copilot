'use client';

import { useEffect, useRef, useState } from 'react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Array<{id: string; name: string; type: string; status: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocs = () => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!user) { return; }
    refreshDocs();
  }, [user]);

  const getDocType = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      pdf: 'pdf', txt: 'txt', md: 'md', doc: 'docx', docx: 'docx',
      csv: 'csv', json: 'json', xlsx: 'xlsx', xls: 'xlsx',
      pptx: 'pptx', png: 'image', jpg: 'image', jpeg: 'image', gif: 'image',
    };
    return map[ext] ?? 'other';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { return; }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId: '',
          name: file.name,
          originalName: file.name,
          type: getDocType(file.name),
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          visibility: 'private',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        setUploading(false);
        return;
      }

      refreshDocs();
      setUploading(false);
      e.target.value = '';
    } catch {
      setError('Upload failed');
      setUploading(false);
    }
  };

  if (loading) {return <div>Loading documents...</div>;}

  return (
    <AuthGuard>
      <div className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md,.doc,.docx,.csv,.json,.xlsx,.xls"
          onChange={handleUpload}
        />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Documents</h1>
          <Button variant="primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
        {error && (
          <Card className="p-4 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </Card>
        )}
        {uploading && (
          <Card className="p-6 text-center mb-4">
            <p className="text-muted">Uploading document...</p>
          </Card>
        )}
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted mb-4">No documents yet</p>
              <Button variant="primary" onClick={() => fileInputRef.current?.click()}>Upload Document</Button>
              <p className="text-sm text-muted-foreground mt-2">Upload PDF, text, markdown, or other documents.</p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="p-4 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {doc.type || 'unknown type'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{doc.status || 'ready'}</span>
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
