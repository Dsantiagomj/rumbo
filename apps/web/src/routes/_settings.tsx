import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/shared/api';
import { SettingsLayout } from '@/shared/ui/layouts';

export const Route = createFileRoute('/_settings')({
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
  component: SettingsLayout,
});
