import type { ApiResponse } from "@/lib/api";

/**
 * `{ success, data, message }` konvertidan ma'lumotni oladi.
 * Muvaffaqiyatsiz yoki ma'lumotsiz javobda server xabari (u yo'q bo'lsa `fallback`) bilan Error tashlaydi.
 */
export function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallback);
  return response.data;
}
