import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatTime } from "../format-date";

describe("format-date", () => {
  it("Date obyektini brauzer tiliga bog'liq bo'lmagan ko'rinishda chiqaradi", () => {
    const value = new Date(2026, 2, 5, 9, 7, 3);
    expect(formatDate(value)).toBe("05.03.2026");
    expect(formatDateTime(value)).toBe("05.03.2026 09:07");
    expect(formatTime(value)).toBe("09:07");
  });

  it("millisekund va vaqt mintaqasiz ISO satrni mahalliy vaqt sifatida o'qiydi", () => {
    expect(formatDateTime(new Date(2026, 10, 9, 18, 30).getTime())).toBe("09.11.2026 18:30");
    expect(formatDateTime("2026-11-09T18:30:00")).toBe("09.11.2026 18:30");
  });

  it("vaqt mintaqasi ko'rsatilgan ISO satrni mahalliy vaqtga o'giradi", () => {
    const iso = "2026-09-15T21:30:00+05:00";
    const local = new Date(iso);
    const pad = (part: number) => String(part).padStart(2, "0");
    const date = `${pad(local.getDate())}.${pad(local.getMonth() + 1)}.${local.getFullYear()}`;
    const time = `${pad(local.getHours())}:${pad(local.getMinutes())}`;

    expect(formatDate(iso)).toBe(date);
    expect(formatDateTime(iso)).toBe(`${date} ${time}`);
    expect(formatTime(iso)).toBe(time);
    expect(formatDateTime("2026-09-15T16:30:00Z")).toBe(`${date} ${time}`);
  });

  it("faqat sanadan iborat satrni vaqt mintaqasidan qat'i nazar o'sha kun sifatida chiqaradi", () => {
    expect(formatDate("2026-09-15")).toBe("15.09.2026");
    expect(formatDate("2026-01-01")).toBe("01.01.2026");
    expect(formatDateTime("2026-09-15")).toBe("15.09.2026 00:00");
  });

  it.each([null, undefined, ""])("bo'sh qiymat (%s) uchun chiziqcha qaytaradi", (value) => {
    expect(formatDate(value)).toBe("—");
    expect(formatDateTime(value)).toBe("—");
    expect(formatTime(value)).toBe("—");
  });

  it("noto'g'ri qiymat uchun chiziqcha qaytaradi", () => {
    expect(formatDate("sana emas")).toBe("—");
    expect(formatDate("2026-02-31")).toBe("—");
    expect(formatDateTime(Number.NaN)).toBe("—");
    expect(formatTime(new Date("xato"))).toBe("—");
  });

  it("bo'sh yoki noto'g'ri qiymat uchun berilgan matnni qaytaradi", () => {
    expect(formatDate(null, "Kiritilmagan")).toBe("Kiritilmagan");
    expect(formatDateTime("", "")).toBe("");
    expect(formatTime("xato", "yo'q")).toBe("yo'q");
    expect(formatDate("2026-09-15", "Kiritilmagan")).toBe("15.09.2026");
  });
});
