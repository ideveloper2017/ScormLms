import { describe, expect, it } from "vitest";
import { statusLabel } from "@/lib/status-labels";

describe("statusLabel", () => {
  it("backend holatlarini o'zbekcha ko'rsatadi, katta-kichik harf farqlanmaydi", () => {
    expect(statusLabel("DRAFT")).toBe("Qoralama");
    expect(statusLabel("published")).toBe("E'lon qilingan");
    expect(statusLabel("VERIFIED")).toBe("Tasdiqlangan");
    expect(statusLabel("IN_PROGRESS")).toBe("Jarayonda");
  });

  it("himoya qarori, mashg'ulot turi va o'quv faolligi kodlarini o'zbekcha ko'rsatadi", () => {
    expect(statusLabel("PASS")).toBe("O'tdi");
    expect(statusLabel("DEFENDED")).toBe("Himoya qilingan");
    expect(statusLabel("lecture")).toBe("Ma'ruza");
    expect(statusLabel("QUIZ_SUBMITTED")).toBe("Test topshirildi");
    expect(statusLabel("INVITED")).toBe("Taklif qilingan");
  });

  it("noma'lum qiymat o'zgarmaydi, bo'sh qiymat — tire", () => {
    expect(statusLabel("Tekshirilgan")).toBe("Tekshirilgan");
    expect(statusLabel(null)).toBe("—");
  });
});
