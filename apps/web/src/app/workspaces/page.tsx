import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function WorkspacesPage() {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workspaces')
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data.workspaces || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading workspaces...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Workspaces</h1>
      <div className="space-y-4">
        {workspaces.map((ws) => (
          <div key={ws.id} className="p-4 border rounded">
            <h3 className="font-medium">{ws.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {ws.id}</p>
          </div>
        ))}
        {workspaces.length === 0 && <p className="text-muted-foreground">No workspaces found</p>}
      </div>
    </div>
  );
}
