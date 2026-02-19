import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { authClient } from '@/shared/api';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/verify-email')({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
});

type VerificationStatus = 'loading' | 'success' | 'error';

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<VerificationStatus>(() => (token ? 'loading' : 'error'));
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided.');
      return;
    }

    async function verify() {
      const { error } = await authClient.verifyEmail({
        query: { token: token as string },
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message ?? 'Verification failed. The link may have expired.');
      } else {
        setStatus('success');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your email address.
            </p>
          )}

          {status === 'success' && (
            <>
              <p className="text-sm text-muted-foreground">
                Your email has been verified. You are now signed in.
              </p>
              <Button asChild className="w-full">
                <Link to="/">Go to dashboard</Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Go to sign in</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
