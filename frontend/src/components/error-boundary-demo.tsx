/**
 * ErrorBoundary Demo Page
 * 
 * This file demonstrates how to use the ErrorBoundary component
 * in different scenarios. It's useful for testing and documentation.
 * 
 * To use this demo:
 * 1. Import this component in your App.tsx or router
 * 2. Navigate to the demo route
 * 3. Click buttons to trigger different error scenarios
 */

import React, { useState } from 'react';
import { ErrorBoundary, DefaultErrorFallback, useErrorBoundary } from './error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Component that throws an error
const BuggyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Bu test xatoligi. Komponent render paytida xatolik chiqdi.');
  }
  return <div className="text-green-600 font-medium">✓ Komponent muvaffaqiyatli yuklandi</div>;
};

// Component that throws async error
const AsyncBuggyComponent: React.FC = () => {
  const [hasError, setHasError] = useState(false);

  const throwAsyncError = () => {
    setHasError(true);
  };

  if (hasError) {
    throw new Error('Asinxron xatolik yuz berdi');
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground">Asinxron xatolikni test qilish</div>
      <Button onClick={throwAsyncError} variant="destructive" size="sm">
        Asinxron xatolikni chiqarish
      </Button>
    </div>
  );
};

// Component demonstrating useErrorBoundary hook
const ComponentWithHook: React.FC = () => {
  const throwError = useErrorBoundary();

  const handleClick = () => {
    throwError(new Error('Hook orqali xatolik chiqarildi'));
  };

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground">useErrorBoundary hook'ini test qilish</div>
      <Button onClick={handleClick} variant="destructive" size="sm">
        Hook orqali xatolik chiqarish
      </Button>
    </div>
  );
};

// Custom fallback component example
const CustomErrorFallback: React.FC<{
  error?: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="rounded-lg border-2 border-destructive bg-destructive/5 p-6">
      <h3 className="text-lg font-bold text-destructive">Custom Error UI</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Bu maxsus error fallback komponent misoli
      </p>
      <p className="mt-2 text-sm font-mono">{error?.message}</p>
      <Button onClick={resetError} className="mt-4" size="sm">
        Tiklash
      </Button>
    </div>
  );
};

/**
 * Main demo component
 */
export const ErrorBoundaryDemo: React.FC = () => {
  const [key1, setKey1] = useState(0);
  const [key2, setKey2] = useState(0);
  const [key3, setKey3] = useState(0);
  const [key4, setKey4] = useState(0);
  const [shouldThrow1, setShouldThrow1] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">ErrorBoundary Demo</h1>
        <p className="mt-2 text-muted-foreground">
          ErrorBoundary komponentining turli xil ishlatish usullarini ko'ring
        </p>
      </div>

      <Separator />

      {/* Example 1: Basic Error Boundary */}
      <Card>
        <CardHeader>
          <CardTitle>1. Oddiy Error Boundary</CardTitle>
          <CardDescription>
            Render paytida xatolik chiqarish va default error UI'ni ko'rsatish
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorBoundary key={key1}>
            <BuggyComponent shouldThrow={shouldThrow1} />
          </ErrorBoundary>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShouldThrow1(true);
                setKey1(Date.now());
              }}
              variant="destructive"
            >
              Xatolik chiqarish
            </Button>
            <Button
              onClick={() => {
                setShouldThrow1(false);
                setKey1(Date.now());
              }}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Example 2: Error Boundary with Custom Fallback */}
      <Card>
        <CardHeader>
          <CardTitle>2. Maxsus Fallback bilan Error Boundary</CardTitle>
          <CardDescription>
            O'zingizning xatolik UI'ingizni yarating
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorBoundary key={key2} fallback={CustomErrorFallback}>
            <AsyncBuggyComponent />
          </ErrorBoundary>

          <Button onClick={() => setKey2(Date.now())} variant="outline">
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Example 3: Using useErrorBoundary Hook */}
      <Card>
        <CardHeader>
          <CardTitle>3. useErrorBoundary Hook</CardTitle>
          <CardDescription>
            Functional komponentdan xatolik chiqarish
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorBoundary key={key3}>
            <ComponentWithHook />
          </ErrorBoundary>

          <Button onClick={() => setKey3(Date.now())} variant="outline">
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Example 4: Using DefaultErrorFallback */}
      <Card>
        <CardHeader>
          <CardTitle>4. DefaultErrorFallback Component</CardTitle>
          <CardDescription>
            To'liq sahifa uchun error UI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorBoundary key={key4} fallback={DefaultErrorFallback}>
            <AsyncBuggyComponent />
          </ErrorBoundary>

          <Button onClick={() => setKey4(Date.now())} variant="outline">
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Ishlatish Misollari</CardTitle>
          <CardDescription>
            Kod misollari
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Oddiy ishlatish:</h4>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
{`import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Maxsus fallback bilan:</h4>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
{`import { ErrorBoundary } from '@/components/error-boundary';

const CustomFallback = ({ error, resetError }) => (
  <div>
    <h2>Xatolik: {error?.message}</h2>
    <button onClick={resetError}>Qayta urinish</button>
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={CustomFallback}>
      <YourComponent />
    </ErrorBoundary>
  );
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">useErrorBoundary hook:</h4>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
{`import { useErrorBoundary } from '@/components/error-boundary';

function MyComponent() {
  const throwError = useErrorBoundary();

  const handleError = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      throwError(err);
    }
  };

  return <button onClick={handleError}>Do something</button>;
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Route wrapper:</h4>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
{`import { ErrorBoundary } from '@/components/error-boundary';

function Router() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Major route'larda ishlating:</strong> Har bir asosiy sahifani ErrorBoundary bilan o'rang
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Nested boundaries:</strong> Kichikroq komponentlar uchun alohida boundaries ishlating
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Error logging:</strong> Production'da error tracking service bilan integratsiya qiling
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>User-friendly messages:</strong> Texnik xatoliklarni oddiy tilga tarjima qiling
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600">✗</span>
              <span>
                <strong>Event handler xatoliklari:</strong> ErrorBoundary event handler'lardagi xatoliklarni ushlamaydi, try-catch ishlating
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600">✗</span>
              <span>
                <strong>Async xatoliklar:</strong> Promise rejection'larni ErrorBoundary ushlamas, unhandledrejection event listener qo'shing
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorBoundaryDemo;
