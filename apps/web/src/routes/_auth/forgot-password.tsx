import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@/features/auth';

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
