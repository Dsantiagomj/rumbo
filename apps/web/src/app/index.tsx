import { APP_NAME } from '@rumbo/shared';
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type HealthStatus = {
  status: 'ok';
  timestamp: string;
};

type ConnectionState = 'loading' | 'connected' | 'disconnected';

export function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data: HealthStatus) => {
        setHealthData(data);
        setConnectionState('connected');
      })
      .catch(() => {
        setConnectionState('disconnected');
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted-foreground">Personal finance management</p>

      <div className="mt-4 rounded-lg border border-border bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">API Connection</p>
        {connectionState === 'loading' && <p className="mt-2 text-sm">Checking...</p>}
        {connectionState === 'connected' && (
          <div className="mt-2">
            <p className="font-medium text-primary">Connected</p>
            {healthData && (
              <p className="mt-1 text-xs text-muted-foreground">{healthData.timestamp}</p>
            )}
          </div>
        )}
        {connectionState === 'disconnected' && (
          <p className="mt-2 font-medium text-destructive">Disconnected</p>
        )}
      </div>
    </div>
  );
}
