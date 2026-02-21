import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_settings/settings/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold">Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure how and when you receive alerts and reminders.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-12">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
