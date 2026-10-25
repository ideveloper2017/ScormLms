import { describe, expect, it } from "vitest";
import { groupDepartments, isCommonDepartment } from "@/lib/departments";

describe("departments", () => {
  const departments = [
    { id: 1, name: "Oliy matematika", active: true, facultyId: 10, facultyName: "Fizika-matematika" },
    { id: 2, name: "Ijtimoiy fanlar", active: true, facultyId: null, facultyName: null },
    { id: 3, name: "Chet tillari", active: true },
    { id: 4, name: "Dasturiy injiniring", active: true, facultyId: 20, facultyName: "Axborot texnologiyalari" },
  ];

  it("fakultetsiz kafedrani umumiy deb hisoblaydi", () => {
    expect(isCommonDepartment(departments[1])).toBe(true);
    expect(isCommonDepartment(departments[2])).toBe(true);
    expect(isCommonDepartment(departments[0])).toBe(false);
  });

  it("umumiy kafedralarni alohida, qolganlarini fakultet bo'yicha guruhlaydi", () => {
    const { common, faculties } = groupDepartments(departments);
    expect(common.map((d) => d.id).sort()).toEqual([2, 3]);
    expect(faculties.map(([faculty, items]) => [faculty, items.map((d) => d.id)])).toEqual([
      ["Axborot texnologiyalari", [4]],
      ["Fizika-matematika", [1]],
    ]);
  });
});
