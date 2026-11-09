import { describe, expect, it } from "vitest";
import { isSafeHref, safeHref } from "@/lib/safe-url";

describe("safeHref", () => {
  it("http, https, mailto va tel manzillarini o'zgarishsiz qaytaradi", () => {
    expect(safeHref("https://example.uz/a?b=1")).toBe("https://example.uz/a?b=1");
    expect(safeHref("http://example.uz")).toBe("http://example.uz");
    expect(safeHref("mailto:info@example.uz")).toBe("mailto:info@example.uz");
    expect(safeHref("tel:+998901234567")).toBe("tel:+998901234567");
  });

  it("sayt ichidagi nisbiy yo'llarga ruxsat beradi", () => {
    expect(safeHref("/uploads/file.pdf")).toBe("/uploads/file.pdf");
    expect(safeHref("./file.pdf")).toBe("./file.pdf");
    expect(safeHref("#bolim")).toBe("#bolim");
  });

  it("javascript:, data: va vbscript: sxemalarini rad etadi", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("  JavaScript:alert(1)")).toBeUndefined();
    expect(safeHref("java\tscript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(safeHref("vbscript:msgbox(1)")).toBeUndefined();
  });

  it("protokolsiz tashqi manzil (//host) http(s) sifatida qabul qilinadi", () => {
    expect(safeHref("//example.uz/a")).toBe("//example.uz/a");
  });

  it("bo'sh qiymatlar uchun undefined qaytaradi", () => {
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref("   ")).toBeUndefined();
  });

  it("isSafeHref mantiqiy natija beradi", () => {
    expect(isSafeHref("https://example.uz")).toBe(true);
    expect(isSafeHref("javascript:void(0)")).toBe(false);
  });
});
