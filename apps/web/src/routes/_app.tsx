import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '@/shared/api';
import { AppLayout } from '@/shared/ui/layouts';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
    return { user: session.data.user, session: session.data.session };
  },
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
