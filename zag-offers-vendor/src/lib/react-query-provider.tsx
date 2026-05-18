'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactNode } from 'react';
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
      retry: 3,
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
