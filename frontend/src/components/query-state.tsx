import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueryStateProps {
  /** So'rov hali javob bermagan */
  isLoading?: boolean;
  /** So'rov xato bilan tugagan */
  isError?: boolean;
  /** Xato obyekti: matni foydalanuvchiga ko'rsatiladi (api.ts uni o'zbekchaga o'giradi) */
  error?: unknown;
  /** "Qayta urinish" tugmasi bosilganda (odatda `query.refetch`) */
  onRetry?: () => void;
  /** Ma'lumot keldi, lekin ro'yxat bo'sh */
  isEmpty?: boolean;
  /** Bo'sh holat matni */
  emptyText?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Ro'yxat/sahifa uchun yagona yuklanish, xato va bo'sh holat. Xato "ma'lumot yo'q" bo'lib ko'rinmasligi uchun
 * tartib qat'iy: avval yuklanish, keyin xato, keyin bo'sh holat, oxirida kontent.
 *
 *   <QueryState isLoading={q.isLoading} isError={q.isError} error={q.error} onRetry={q.refetch}
 *               isEmpty={!q.data?.length} emptyText="Hozircha topshiriq yo'q">
 *     ...ro'yxat...
 *   </QueryState>
 */
export function QueryState({
  isLoading, isError, error, onRetry, isEmpty, emptyText = "Ma'lumot topilmadi", className, children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div role="status" className={cn("flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Yuklanmoqda...
      </div>
    );
  }
  if (isError) {
    const message = error instanceof Error && error.message ? error.message : "Ma'lumotni yuklab bo'lmadi.";
    return (
      <div role="alert" className={cn("flex flex-col items-center gap-3 py-10 text-center", className)}>
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={() => onRetry()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Qayta urinish
          </Button>
        )}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground", className)}>
        <Inbox className="h-6 w-6" aria-hidden="true" />
        <p>{emptyText}</p>
      </div>
    );
  }
  return <>{children}</>;
}
