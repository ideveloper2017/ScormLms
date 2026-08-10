import { describe, expect, it } from 'vitest';
import {
  academicYearOptions,
  courseNumberFromSemester,
  filterAdmissionGroups,
  filterAdmissionPrograms,
  programDegreeLevel,
  semesterOptionsForDegree,
} from '../student-admission-cascade';
import type { GroupRecord, ProgramRecord } from '../academic-api';

const group = (id: number, educationYear: string | null, language: string | null, active = true): GroupRecord => ({
  id, name: `G-${id}`, educationYear, language, active, programId: 4,
});

describe('student admission academic cascade', () => {
  it('starts with the current academic year and keeps configured active years', () => {
    const groups = [group(1, '2025-2026', 'uz'), group(2, '2024-2025', 'uz'), group(3, '2027-2028', 'uz', false)];
    expect(academicYearOptions(groups, new Date('2026-08-08T00:00:00Z'))).toEqual(['2026-2027', '2025-2026', '2024-2025']);
  });

  it('derives degree semesters and course number without a second manual course input', () => {
    expect(programDegreeLevel({ degreeLevel: 'master' } as ProgramRecord)).toBe('MASTER');
    expect(semesterOptionsForDegree('MASTER')).toEqual([1, 2, 3, 4]);
    expect(courseNumberFromSemester(1)).toBe(1);
    expect(courseNumberFromSemester(3)).toBe(2);
    expect(courseNumberFromSemester(8)).toBe(4);
  });

  it('shows only active groups matching selected year and language', () => {
    const groups = [
      group(1, '2026-2027', 'uz'), group(2, '2025-2026', 'uz'),
      group(3, '2026-2027', 'ru'), group(4, '2026-2027', null), group(5, '2026-2027', 'uz', false),
    ];
    expect(filterAdmissionGroups(groups, '2026-2027', 'uz').map((item) => item.id)).toEqual([1, 4]);
  });

  it('shows only programs having an active group in the selected year', () => {
    const programs = [
      { id: 4, name: 'Dastur 4', active: true },
      { id: 5, name: 'Dastur 5', active: true },
      { id: 6, name: 'Dastur 6', active: false },
    ] as ProgramRecord[];
    const groups = [group(1, '2026-2027', 'uz'), { ...group(2, '2025-2026', 'uz'), programId: 5 }];
    expect(filterAdmissionPrograms(programs, groups, '2026-2027').map((item) => item.id)).toEqual([4]);
  });
});
