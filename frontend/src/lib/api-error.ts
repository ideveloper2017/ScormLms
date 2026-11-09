/** Xato matni topilmaganda ko'rsatiladigan umumiy xabar. */
const DEFAULT_MESSAGE = "Amalni bajarib bo'lmadi.";

/** Server o'z xabari o'rniga qaytaradigan HTTP holat nomlari (lib/api.ts dagi friendlyErrorMessage bilan bir xil ro'yxat). */
const HTTP_STATUS_TEXT = /^(Bad Request|Forbidden|Unauthorized|Not Found|Internal Server Error|Conflict)$/i;

const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/**
 * Server javobi tanasidagi xabar: `message`, bo'lmasa `detail`, bo'lmasa `error`. Topilmasa undefined.
 * Matn o'zgartirilmasdan qaytadi; axios xatosi ham, `{ response: { data } }` ko'rinishidagi obyekt ham qabul qilinadi.
 */
export function responseErrorMessage(error: unknown): string | undefined {
  const data = (error as { response?: { data?: unknown } } | null | undefined)?.response?.data;
  if (typeof data !== "object" || data === null) return undefined;
  const { message, detail, error: reason } = data as { message?: unknown; detail?: unknown; error?: unknown };
  return [message, detail, reason].find(isText);
}

/**
 * Har qanday tashlangan qiymatdan foydalanuvchiga ko'rsatiladigan matn.
 * Tartib: server xabari → Error.message (axios xatolarida lib/api.ts uni o'zbekcha izohga almashtirgan) → satr → `fallback`.
 * Serverning "Not Found" kabi holat nomi xabar hisoblanmaydi.
 */
export function apiErrorMessage(error: unknown, fallback: string = DEFAULT_MESSAGE): string {
  const fromServer = responseErrorMessage(error)?.trim();
  if (fromServer && !HTTP_STATUS_TEXT.test(fromServer)) return fromServer;
  if (error instanceof Error && isText(error.message)) return error.message;
  if (isText(error)) return error;
  return fallback;
}
