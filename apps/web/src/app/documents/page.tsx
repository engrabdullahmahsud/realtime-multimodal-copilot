import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function DocumentsPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(data.documents || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading documents...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Documents</h1>
      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 border rounded">
            <h3 className="font-medium">{doc.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {doc.id}</p>
          </div>
        ))}
        {documents.length === 0 && <p className="text-muted-foreground">No documents found</p>}
      </div>
    </div>
  );
}
