import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginForm } from '@/features/auth';

const searchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.startsWith('/') && !val.startsWith('//')),
      'Invalid redirect path',
    ),
});

export const Route = createFileRoute('/_auth/login')({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  return <LoginForm />;
}
