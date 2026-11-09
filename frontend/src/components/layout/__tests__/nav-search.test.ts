import { describe, expect, it } from "vitest";
import { buildNav } from "../app-sidebar";
import { countNavLinks, normalizeSearchText, searchNav } from "../nav-search";

describe("menyu qidiruvi", () => {
  const adminNav = buildNav("super_admin");

  it("bo'sh so'rovda null qaytaradi: odatdagi menyu ko'rsatiladi", () => {
    expect(searchNav(adminNav, "")).toBeNull();
    expect(searchNav(adminNav, "   ")).toBeNull();
  });

  it("sahifani nomining bir qismi bo'yicha topadi va bo'limini ko'rsatadi", () => {
    const results = searchNav(adminNav, "transkript")!;

    expect(results).toEqual([expect.objectContaining({ name: "Transkript", href: "/transcript-students", group: "Akademik arxiv" })]);
  });

  it("katta-kichik harf va apostrof turini farqlamaydi", () => {
    const plain = searchNav(adminNav, "o'quv reja")!.map((r) => r.href);
    const typographic = searchNav(adminNav, "OʻQUV REJA")!.map((r) => r.href);

    expect(plain).toContain("/edu-process/curriculum");
    expect(typographic).toEqual(plain);
    expect(normalizeSearchText("  Oʻquv   Reja ")).toBe("o'quv reja");
  });

  it("bo'lim nomi mos kelsa uning barcha sahifalarini beradi", () => {
    const results = searchNav(adminNav, "akkauntlar")!;

    expect(results.map((r) => r.name)).toEqual(["Administratorlar", "Ruxsat guruhlari"]);
    expect(results.every((r) => r.group === "Akkauntlar")).toBe(true);
  });

  it("o'zi havola bo'lgan bo'limni ham topadi", () => {
    expect(searchNav(adminNav, "universitet")).toEqual([
      expect.objectContaining({ name: "Universitetlar", href: "/universities", group: "" }),
    ]);
  });

  it("bir xil nomli, lekin turli bo'limdagi sahifalarni bo'limi bilan ajratib beradi", () => {
    const results = searchNav(adminNav, "o'zlashtirish ko'rsatkichi")!;

    expect(results.map((r) => [r.group, r.href])).toEqual([
      ["O'zlashtirish", "/users/rating-average"],
      ["Statistika", "/appropriation"],
    ]);
  });

  it("hech narsa topilmasa bo'sh ro'yxat qaytaradi", () => {
    expect(searchNav(adminNav, "bunday-sahifa-yoq")).toEqual([]);
  });

  it("havolalar sonini bo'lim havolalari bilan birga sanaydi", () => {
    expect(countNavLinks(adminNav)).toBeGreaterThan(80);
    expect(countNavLinks(buildNav("proctor"))).toBeLessThan(15);
  });
});
