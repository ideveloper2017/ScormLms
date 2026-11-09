import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
  /** Savol, masalan "Dars o'chirilsinmi?" */
  title: string;
  /** Nima bo'lishini tushuntiruvchi matn */
  description?: ReactNode;
  /** Tasdiqlash tugmasi matni (standart: "Ha, davom etish") */
  confirmLabel?: string;
  /** Bekor qilish tugmasi matni (standart: "Bekor qilish") */
  cancelLabel?: string;
  /** Qaytarib bo'lmaydigan amal: tugma qizil bo'ladi (standart: true) */
  destructive?: boolean;
}

/**
 * O'chirish, bekor qilish kabi qaytarib bo'lmaydigan amallar oldidan tasdiq so'raydi.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   ...
 *   if (!(await confirm({ title: "Dars o'chirilsinmi?", description: "Bu amalni qaytarib bo'lmaydi." }))) return;
 *   ...
 *   return <>{...}{confirmDialog}</>;
 *
 * `window.confirm` o'rniga ishlatiladi: ilova uslubida, o'zbekcha va klaviatura bilan ishlaydi.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    // Oldingi javobsiz so'rov bo'lsa rad etilgan deb yopiladi
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const destructive = options?.destructive ?? true;
  const confirmDialog = (
    <AlertDialog open={options !== null} onOpenChange={(open) => { if (!open) settle(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {options?.description ?? "Bu amalni qaytarib bo'lmaydi."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{options?.cancelLabel ?? "Bekor qilish"}</AlertDialogCancel>
          <AlertDialogAction
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? "Ha, davom etish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, confirmDialog };
}
