const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Foydalanuvchi yoki backend bergan manzilni `href`/`src` ga qo'yishdan oldin tekshiradi.
 * Faqat http(s), mailto, tel va sayt ichidagi nisbiy yo'llarga ruxsat beriladi; `javascript:`,
 * `data:` kabi sxemalar uchun `undefined` qaytadi (havola bosilmaydigan bo'lib qoladi).
 */
export function safeHref(url: string | null | undefined): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;

  // Sayt ichidagi yo'l: "/uploads/a.pdf", "./a", "#anchor", "?q=1". "//host" tashqi manzil, pastda tekshiriladi.
  if (/^(\/(?!\/)|\.{1,2}\/|#|\?)/.test(value)) return value;

  try {
    const parsed = new URL(value, window.location.origin);
    return SAFE_SCHEMES.has(parsed.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** `safeHref` ning mantiqiy ko'rinishi: havolani ko'rsatish/yashirish uchun. */
export function isSafeHref(url: string | null | undefined): boolean {
  return safeHref(url) !== undefined;
}
