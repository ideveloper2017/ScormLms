import type { DepartmentRecord } from "@/lib/academic-api";

export const COMMON_DEPARTMENT_LABEL = "Umumiy kafedra";

/** Fakultetga bog'lanmagan kafedra — universitet miqyosidagi umumiy kafedra. */
export function isCommonDepartment(d: Pick<DepartmentRecord, "facultyId">): boolean {
  return d.facultyId == null;
}

/** Kafedralarni guruhlaydi: avval umumiy kafedralar, keyin fakultetlar bo'yicha. */
export function groupDepartments(departments: DepartmentRecord[]) {
  const sorted = [...departments].sort((a, b) => a.name.localeCompare(b.name));
  const common = sorted.filter(isCommonDepartment);
  const byFaculty = new Map<string, DepartmentRecord[]>();
  for (const d of sorted) {
    if (isCommonDepartment(d)) continue;
    const key = d.facultyName ?? `Fakultet #${d.facultyId}`;
    byFaculty.set(key, [...(byFaculty.get(key) ?? []), d]);
  }
  const faculties = [...byFaculty.entries()].sort(([a], [b]) => a.localeCompare(b));
  return { common, faculties };
}
