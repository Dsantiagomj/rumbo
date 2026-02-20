import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AuthLayout } from '@/features/auth';
import { authClient } from '@/shared/api';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      throw redirect({ to: '/' });
    }
  },
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
