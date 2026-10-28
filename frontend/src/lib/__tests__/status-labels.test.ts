import { describe, expect, it } from "vitest";
import { statusLabel } from "@/lib/status-labels";

describe("statusLabel", () => {
  it("backend holatlarini o'zbekcha ko'rsatadi, katta-kichik harf farqlanmaydi", () => {
    expect(statusLabel("DRAFT")).toBe("Qoralama");
    expect(statusLabel("published")).toBe("E'lon qilingan");
    expect(statusLabel("VERIFIED")).toBe("Tasdiqlangan");
    expect(statusLabel("IN_PROGRESS")).toBe("Jarayonda");
  });

  it("noma'lum qiymat o'zgarmaydi, bo'sh qiymat — tire", () => {
    expect(statusLabel("Tekshirilgan")).toBe("Tekshirilgan");
    expect(statusLabel(null)).toBe("—");
  });
});
