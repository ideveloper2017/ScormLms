import type { ConfirmOptions } from "@/components/confirm-dialog";
import type { useToast } from "@/hooks/use-toast";

export type ItemStatus = "DRAFT" | "PUBLISHED";
/** Dars formasida "modulsiz" tanlovi */
export const NO_UNIT = "none";
export type ContentType = "VIDEO" | "DOCUMENT" | "LINK" | "FILE" | "TEXT";
export const today = () => {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
};

/** Konteynerdagi yagona `useConfirm` dialogini tablarga uzatish uchun */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

type Toast = ReturnType<typeof useToast>["toast"];

/** Mutatsiya xatosini qizil toast bilan ko'rsatadigan `onError` yasaydi */
export function createShowError(toast: Toast) {
  return function showError(title: string) {
    return (cause: Error) =>
      toast({
        variant: "destructive",
        title,
        description: cause instanceof Error ? cause.message : undefined,
      });
  };
}
