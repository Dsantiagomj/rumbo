import { APP_NAME } from '@rumbo/shared';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/shared/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type HealthStatus = {
  status: 'ok';
  timestamp: string;
};

type ConnectionState = 'loading' | 'connected' | 'disconnected';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthStatus>;
      })
      .then((data) => {
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

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>API Connection</CardTitle>
          <CardDescription>
            {connectionState === 'loading' && 'Checking...'}
            {connectionState === 'connected' && 'Connected'}
            {connectionState === 'disconnected' && 'Disconnected'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionState === 'connected' && healthData && (
            <p className="text-xs text-muted-foreground">{healthData.timestamp}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="demo-input">Demo input</Label>
            <Input id="demo-input" placeholder="Type something..." />
          </div>
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
