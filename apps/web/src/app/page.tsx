import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function HomePage() {
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Real-Time Multimodal Copilot</h1>
      <p className="text-muted-foreground">Welcome to your AI workspace</p>
      
      <div className="mt-6">
        <h2>Workspaces</h2>
        {loading ? <p>Loading workspaces...</p> : (
          <ul className="space-y-2">
            {workspaces.map((ws) => (
              <li key={ws.id} className="p-2 rounded hover:bg-muted">
                <a href={`/workspaces/${ws.id}`} className="text-primary hover underline">
                  {ws.name}
                </a>
              </li>
            ))}
          </ul>
        )}
        
        <div className="mt-6">
          <a href="/conversations" className="btn-primary">View Conversations</a>
          <a href="/workspaces" className="btn-secondary ml-2">Manage Workspaces</a>
        </div>
      </div>
    </div>
  );
}
