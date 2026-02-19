import { APP_NAME } from '@rumbo/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { healthQueryOptions } from '@/shared/api';
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

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage() {
  const { data, isPending, isError } = useQuery(healthQueryOptions());
  const statusLabel = isPending ? 'Checking...' : isError ? 'Disconnected' : 'Connected';

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted-foreground">Personal finance management</p>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>API Connection</CardTitle>
          <CardDescription>{statusLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data && <p className="text-xs text-muted-foreground">{data.timestamp}</p>}
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
