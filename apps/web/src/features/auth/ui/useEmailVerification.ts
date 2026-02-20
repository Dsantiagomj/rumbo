import { useEffect, useState } from 'react';
import { authClient } from '@/shared/api';

type VerificationStatus = 'loading' | 'success' | 'error';

export function useEmailVerification(token: string | undefined) {
  const [status, setStatus] = useState<VerificationStatus>(() => (token ? 'loading' : 'error'));
  const [errorMessage, setErrorMessage] = useState('');

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

  return { status, errorMessage };
}
