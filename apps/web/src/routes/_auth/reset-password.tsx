import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { ResetPasswordForm } from '@/features/auth';

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/_auth/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Request new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
