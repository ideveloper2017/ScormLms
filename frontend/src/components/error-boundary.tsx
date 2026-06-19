import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ServerCrash, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function getApiErrorInfo(error?: Error): { icon: React.ElementType; title: string; description: string } | null {
  if (!error) return null;
  const msg = error.message || '';
  if (msg.includes('Network Error') || msg.includes('ECONNREFUSED') || msg.includes('ERR_NETWORK')) {
    return { icon: WifiOff, title: 'Server bilan aloqa yo\'q', description: 'Backend server ishga tushirilmagan yoki tarmoq uzilgan. Server ishga tushirilgach qayta urinib ko\'ring.' };
  }
  if (msg.includes('404') || msg.includes('Not Found')) {
    return { icon: FileQuestion, title: 'API endpoint topilmadi', description: 'So\'ralgan ma\'lumot manzili hali backend da yaratilmagan (404). Backend endpoint tayyor bo\'lgach ishlaydi.' };
  }
  if (msg.includes('401') || msg.includes('Unauthorized')) {
    return { icon: ServerCrash, title: 'Autentifikatsiya xatosi', description: 'Sessiya muddati tugagan. Qayta kiring.' };
  }
  if (msg.includes('500') || msg.includes('Internal Server')) {
    return { icon: ServerCrash, title: 'Server ichki xatosi', description: 'Backend server xato qaytardi (500). Dasturchi bilan bog\'laning.' };
  }
  return null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
}

/**
 * ErrorBoundary component for graceful error handling in React
 * 
 * Catches React component errors and prevents white screen of death.
 * Provides user-friendly error UI with retry option.
 * Logs errors to console in development mode.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('[ErrorBoundary] Component error caught:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      const apiInfo = getApiErrorInfo(this.state.error);
      const ApiIcon = apiInfo?.icon ?? AlertTriangle;
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ApiIcon className="h-5 w-5 text-destructive" />
                <CardTitle>{apiInfo?.title ?? 'Xatolik yuz berdi'}</CardTitle>
              </div>
              <CardDescription>
                {apiInfo?.description ?? "Komponent yuklanishida kutilmagan xatolik sodir bo'ldi"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && !apiInfo && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium text-muted-foreground">Xatolik xabari:</p>
                  <p className="mt-1 text-foreground">{this.state.error.message}</p>
                </div>
              )}

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="rounded-md bg-muted p-3 text-xs">
                  <summary className="cursor-pointer font-medium text-muted-foreground">
                    Texnik ma'lumotlar (faqat development rejimida)
                  </summary>
                  <pre className="mt-2 overflow-auto text-foreground">
                    {this.state.error?.message}
                  </pre>
                  <pre className="mt-1 overflow-auto text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.resetError} className="flex-1" variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Qayta urinish
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                  Sahifani yangilash
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Custom error fallback component for specific error scenarios
 * Can be used with ErrorBoundary to provide custom UI
 */
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Dastur xatoligi</CardTitle>
              <CardDescription>
                Sahifa yuklanishida muammo yuz berdi
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Xatolik tavsifi:
                </p>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm text-foreground">{error.message}</p>
                </div>
              </div>

              {import.meta.env.DEV && errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    Batafsil texnik ma'lumot
                  </summary>
                  <div className="mt-2 rounded-md bg-muted p-3">
                    <pre className="overflow-auto text-xs text-foreground">
                      {error.stack}
                    </pre>
                    <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Qayta urinish
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="flex-1"
            >
              Bosh sahifaga qaytish
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Muammo takrorlansa, texnik yordam bilan bog'laning
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Hook to trigger error boundary from functional components
 * Useful for testing error boundaries or manually throwing errors
 */
export const useErrorBoundary = () => {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
};
