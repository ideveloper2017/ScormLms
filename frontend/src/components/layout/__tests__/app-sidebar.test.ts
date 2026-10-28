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
  "559-son qaror",
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
    "%s uchun 16 ta alohida bo'limni to'g'ri tartibda beradi",
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
      "Tuzilishi": 3, // + Kafedralar
      "Ta'lim jarayoni": 14,
      "O'zlashtirish": 7,
      "O'qituvchilar": 2,
      "Talabalar": 5,
      "Talabalar harakati": 3,
      "Akademik arxiv": 2,
      "559-son qaror": 10,
      "Monitoring": 7, // "O'qituvchilar" dublikati olib tashlandi
      "Yangiliklar": 2,
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
    expect(links["Fan oqimlari"]).toBe("/admin/subject-groups");
    expect(links["Kurslar"]).toBe("/admin/courses");
    expect(links["Dars jadvali"]).toBe("/admin/schedule");
    expect(links["Semestrlar"]).toBe("/edu-process/semesters");
    expect(links["Bitirgan talabalar"]).toBe("/students/graduated");
    expect(links["Ko'chirish"]).toBe("/transfer-students");
    expect(links["Chetlashtirilgan talabalar"]).toBe("/students/expelled");
    expect(links["Kafedralar"]).toBe("/admin/departments");
  });
});

describe("oddiy foydalanuvchi uchun menyu", () => {
  it("bir bo'limda bir sahifa ikki marta takrorlanmaydi", () => {
    for (const role of ["super_admin", "metodist", "teacher", "student", "monitoring"]) {
      for (const section of buildNav(role)) {
        const hrefs = section.items.map((item) => item.href);
        expect(new Set(hrefs).size, `${role}: ${section.label}`).toBe(hrefs.length);
      }
    }
  });

  it("inglizcha nomlar yo'q va metodistda 'Kengaytirilgan' aralash guruhi qolmagan", () => {
    const names = ["super_admin", "metodist", "teacher", "student"].flatMap((role) =>
      buildNav(role).flatMap((section) => [section.label, ...section.items.map((item) => item.name)]));
    expect(names).not.toContain("Dashboard");
    expect(names.some((name) => /Vedmost|Audit log|LMS orientatsiyasi/.test(name))).toBe(false);
    expect(buildNav("metodist").map((section) => section.label)).toEqual(
      ["Asosiy", "Tuzilma", "Talabalar", "Ta'lim jarayoni", "Nazorat va hisobot", "Qo'shimcha", "559-son qaror"]);
  });
});
