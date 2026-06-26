import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * ErrorBoundaryTest component - Used for testing ErrorBoundary functionality
 * 
 * This component is ONLY for testing purposes during development.
 * It should NOT be deployed to production.
 * 
 * Usage:
 * 1. Import this component in any page
 * 2. Click "Xatolikni simulyatsiya qilish" button to trigger an error
 * 3. Verify ErrorBoundary catches the error and displays fallback UI
 * 4. Click "Qayta urinish" button to reset the error state
 * 
 * @example
 * import { ErrorBoundaryTest } from '@/components/error-boundary-test';
 * 
 * function MyPage() {
 *   return (
 *     <div>
 *       <h1>My Page</h1>
 *       {import.meta.env.DEV && <ErrorBoundaryTest />}
 *     </div>
 *   );
 * }
 */
export const ErrorBoundaryTest = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    // This will trigger the ErrorBoundary
    throw new Error('Bu test xatoligi. ErrorBoundary ishlagani tekshirilmoqda.');
  }

  return (
    <Card className="border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-600">ErrorBoundary Test</CardTitle>
        </div>
        <CardDescription>
          Faqat development rejimida ko'rinadigan test komponenti
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          ErrorBoundary komponentining ishlashini tekshirish uchun quyidagi tugmani bosing.
          Bu xatolik simulyatsiya qilinadi va ErrorBoundary uni ushlab, foydalanuvchiga
          chiroyli xatolik xabarini ko'rsatishi kerak.
        </p>
        <Button
          onClick={() => setShouldThrow(true)}
          variant="destructive"
          size="sm"
        >
          Xatolikni simulyatsiya qilish
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * Component that throws an error after mount (for async error testing)
 */
export const AsyncErrorTest = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  const triggerAsyncError = () => {
    setTimeout(() => {
      setShouldThrow(true);
    }, 1000);
  };

  if (shouldThrow) {
    throw new Error('Asinxron xatolik: Bu xatolik 1 soniyadan keyin yuzaga keldi.');
  }

  return (
    <Card className="border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-600">Asinxron ErrorBoundary Test</CardTitle>
        </div>
        <CardDescription>
          1 soniyadan keyin xatolik yuzaga keladi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={triggerAsyncError}
          variant="destructive"
          size="sm"
        >
          Asinxron xatolikni boshlash
        </Button>
      </CardContent>
    </Card>
  );
};
