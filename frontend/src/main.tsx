import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import { ThemeProvider } from './components/theme-provider';
import './styles/globals.css';
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from '@/components/error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // Enable automatic request cancellation when component unmounts (AC 15.8)
      // This prevents unnecessary API calls and memory leaks
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Request deduplication is enabled by default in React Query (AC 15.7)
      // Multiple components using the same query will share the same request
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="edulms-ui-theme">
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);