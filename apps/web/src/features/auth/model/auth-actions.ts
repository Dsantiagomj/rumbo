import { sileo } from 'sileo';

interface AuthActionOptions {
  errorTitle: string;
  errorFallback: string;
}

/**
 * Wraps an auth API call with standardized error handling.
 * Returns true on success, false on error.
 */
export async function handleAuthAction(
  action: () => Promise<{ error: { message?: string } | null }>,
  { errorTitle, errorFallback }: AuthActionOptions,
): Promise<boolean> {
  try {
    const { error } = await action();
    if (error) {
      sileo.error({
        title: errorTitle,
        description: error.message ?? errorFallback,
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
