'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { TenantProvider } from '@/lib/context/TenantContext';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
            // 1 reintento (en vez del default 3): si una sección falla (ej. BD del
            // tenant incompleta → 500), no dejamos el dashboard "colgado" ~7s con
            // backoff exponencial antes de mostrar el error. Ver SPEC-002.
            retry: 1,
            retryDelay: 800,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        {children}
      </TenantProvider>
    </QueryClientProvider>
  );
}
