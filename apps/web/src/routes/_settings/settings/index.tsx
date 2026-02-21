import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/shared/api';

export const Route = createFileRoute('/_settings/settings/')({
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    await navigate({ to: '/login' });
  };

  return (
    <div>
      <h1 className="text-lg font-semibold">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account details and profile information.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-12">
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
      </div>

      {/* Danger zone */}
      <div className="mt-12">
        <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
        <div className="mt-3 rounded-lg border border-destructive/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Log out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
