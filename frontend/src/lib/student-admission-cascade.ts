import type { GroupRecord, ProgramRecord } from '@/lib/academic-api';
import type { DegreeLevel } from '@/types/student.types';

const ACADEMIC_YEAR_PATTERN = /^\d{4}-\d{4}$/;

export function currentAcademicYear(now = new Date()): string {
  const year = now.getFullYear();
  const start = now.getMonth() >= 7 ? year : year - 1;
  return `${start}-${start + 1}`;
}

export function academicYearOptions(groups: GroupRecord[], now = new Date()): string[] {
  const current = currentAcademicYear(now);
  const configured = groups
    .filter((group) => group.active)
    .map((group) => group.educationYear?.trim() ?? '')
    .filter((year) => ACADEMIC_YEAR_PATTERN.test(year));
  return [current, ...[...new Set(configured)].filter((year) => year !== current).sort().reverse()];
}

export function programDegreeLevel(program?: ProgramRecord): DegreeLevel {
  const value = program?.degreeLevel?.trim().toUpperCase();
  return value === 'MASTER' || value === 'PHD' || value === 'ASSOCIATE' ? value : 'BACHELOR';
}

export function semesterOptionsForDegree(degree: DegreeLevel): number[] {
  const count = degree === 'BACHELOR' ? 8 : degree === 'PHD' ? 6 : 4;
  return Array.from({ length: count }, (_, index) => index + 1);
}

export function courseNumberFromSemester(semester: number): number {
  return Math.floor((semester - 1) / 2) + 1;
}

export function filterAdmissionPrograms(
  programs: ProgramRecord[],
  groups: GroupRecord[],
  academicYear: string,
): ProgramRecord[] {
  const programIds = new Set(groups
    .filter((group) => group.active && group.educationYear?.trim() === academicYear && group.programId != null)
    .map((group) => group.programId));
  return programs.filter((program) => program.active && programIds.has(program.id));
}

export function filterAdmissionGroups(
  groups: GroupRecord[],
  academicYear: string,
  educationLanguage: string,
): GroupRecord[] {
  return groups.filter((group) => group.active
    && group.educationYear?.trim() === academicYear
    && (!group.language?.trim() || group.language.trim().toLowerCase() === educationLanguage.trim().toLowerCase()));
}
