import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}
