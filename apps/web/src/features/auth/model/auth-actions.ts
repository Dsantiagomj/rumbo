import { sileo } from 'sileo';

type AuthError = { message?: string; code?: string } | null;

interface AuthActionOptions {
  errorTitle: string;
  errorFallback: string;
}

const errorMessagesByCode: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_ALREADY_EXISTS: 'Unable to create account with that email.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Unable to create account with that email.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
  RATE_LIMITED: 'Too many attempts. Please try again later.',
  TOKEN_EXPIRED: 'This link has expired. Please request a new one.',
};

function resolveAuthErrorMessage(error: AuthError, fallback: string) {
  if (!error?.code) return fallback;
  return errorMessagesByCode[error.code] ?? fallback;
}

/**
 * Wraps an auth API call with standardized error handling.
 * Returns true on success, false on error.
 */
export async function handleAuthAction(
  action: () => Promise<{ error: AuthError }>,
  { errorTitle, errorFallback }: AuthActionOptions,
): Promise<boolean> {
  try {
    const { error } = await action();
    if (error) {
      sileo.error({
        title: errorTitle,
        description: resolveAuthErrorMessage(error, errorFallback),
      });
      return false;
    }
    return true;
  } catch {
    sileo.error({
      title: 'Connection error',
      description: 'Unable to reach the server. Please try again.',
    });
    return false;
  }
}
