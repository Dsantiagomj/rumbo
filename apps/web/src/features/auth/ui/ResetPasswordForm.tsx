import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { sileo } from 'sileo';
import { authClient } from '@/shared/api';
import { Button, Input, Label } from '@/shared/ui';
import { handleAuthAction } from '../model/auth-actions';
import type { ResetPasswordFormValues } from '../model/auth-schemas';
import { resetPasswordSchema } from '../model/auth-schemas';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    const ok = await handleAuthAction(
      () => authClient.resetPassword({ newPassword: values.password, token }),
      {
        errorTitle: 'Reset failed',
        errorFallback: 'Token expired or invalid. Please request a new reset link.',
      },
    );
    if (!ok) return;

    sileo.success({
      title: 'Password reset!',
      description: 'Your password has been updated. You can now sign in.',
    });
    await navigate({ to: '/login' });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
}
