import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_settings/settings/data')({
  component: DataPrivacyPage,
});

function DataPrivacyPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold">Data & Privacy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Export your data, manage privacy settings, and delete your account.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-12">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
