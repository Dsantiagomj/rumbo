import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { authClient } from '@/shared/api';
import { Button, Input, Label } from '@/shared/ui';
import type { ForgotPasswordFormValues } from '../model/auth-schemas';
import { forgotPasswordSchema } from '../model/auth-schemas';

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      const { error } = await authClient.forgetPassword({
        email: values.email,
        redirectTo: '/reset-password',
      });

      if (error) {
        sileo.error({
          title: 'Something went wrong',
          description: 'Please try again later.',
        });
        return;
      }

      sileo.success({
        title: 'Check your email',
        description: "If an account with that email exists, we've sent a reset link.",
      });
    } catch {
      sileo.error({
        title: 'Connection error',
        description: 'Unable to reach the server. Please try again.',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
