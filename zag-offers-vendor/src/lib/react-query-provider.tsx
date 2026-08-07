'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactNode } from 'react';
import axios from 'axios';
import { handleApiError } from './errorHandler';
import { emitGlobalError } from './error-events';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const apiError = handleApiError(error);
      emitGlobalError({ message: apiError.message, severity: 'error' });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const apiError = handleApiError(error);
      emitGlobalError({ message: apiError.message, severity: 'error' });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status && [400, 401, 403, 404].includes(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
