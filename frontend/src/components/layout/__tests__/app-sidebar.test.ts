import { describe, expect, it } from "vitest";
import { buildNav } from "../app-sidebar";

const expectedAdminSections = [
  "Universitetlar",
  "Tuzilishi",
  "Ta'lim jarayoni",
  "O'zlashtirish",
  "O'qituvchilar",
  "Talabalar",
  "Talabalar harakati",
  "Akademik arxiv",
  "Monitoring",
  "Yangiliklar",
  "Xabarlar",
  "Akkauntlar",
  "Statistika",
  "Asosiy ma'lumot",
  "Sozlamalar",
];

describe("superadmin sidebar navigation", () => {
  it.each(["super_admin", "ROLE_SUPER_ADMIN", "admin", "ROLE_ADMIN"])(
    "%s uchun 15 ta alohida bo'limni to'g'ri tartibda beradi",
    (role) => {
      expect(buildNav(role).map((section) => section.label)).toEqual(expectedAdminSections);
    },
  );

  it("referensdagi bevosita havolalarni ishlaydigan lokal yo'llarga bog'laydi", () => {
    const sections = buildNav("super_admin");

    expect(sections.find((section) => section.label === "Universitetlar")?.href).toBe("/universities");
    expect(sections.find((section) => section.label === "Xabarlar")?.href).toBe("/messages");
    expect(sections.find((section) => section.label === "Statistika")?.items[0]?.href).toBe("/statistics-dashbord");
  });

  it("har bir ochiladigan bo'limda referensdagi sahifalar sonini saqlaydi", () => {
    const counts: Record<string, number> = {
      "Tuzilishi": 2,
      "Ta'lim jarayoni": 12,
      "O'zlashtirish": 7,
      "O'qituvchilar": 2,
      "Talabalar": 5,
      "Talabalar harakati": 3,
      "Akademik arxiv": 2,
      "Monitoring": 8,
      "Yangiliklar": 3,
      "Akkauntlar": 2,
      "Statistika": 10,
      "Asosiy ma'lumot": 5,
      "Sozlamalar": 3,
    };
    const sections = buildNav("super_admin");

    for (const [label, count] of Object.entries(counts)) {
      expect(sections.find((section) => section.label === label)?.items).toHaveLength(count);
    }
  });

  it("asosiy akademik va talaba harakati yo'llarini referens URL bilan beradi", () => {
    const sections = buildNav("super_admin");
    const links = Object.fromEntries(sections.flatMap((section) => section.items).map((item) => [item.name, item.href]));

    expect(links["O'quv reja"]).toBe("/edu-process/curriculum");
    expect(links["Semestrlar"]).toBe("/edu-process/semesters");
    expect(links["Bitirgan talabalar"]).toBe("/students/graduated");
    expect(links["Ko'chirish"]).toBe("/transfer-students");
    expect(links["Chetlashtirilgan talabalar"]).toBe("/students/expelled");
  });
});
