import { queryOptions } from '@tanstack/react-query';
import { apiClient } from './client';

type HealthResponse = {
  status: 'ok';
  timestamp: string;
};

export function healthQueryOptions() {
  return queryOptions({
    queryKey: ['health'],
    queryFn: () => apiClient<HealthResponse>('/health'),
  });
}
