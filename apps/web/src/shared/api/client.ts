const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiErrorBody = {
  error: {
    message: string;
    code: string;
    status: number;
  };
};

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error) {
        code = body.error.code;
        message = body.error.message;
      }
    } catch {
      // Response body is not JSON, use defaults
    }

    throw new ApiError(response.status, code, message);
  }

  return response.json() as Promise<T>;
}
