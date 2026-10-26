import type { PlanPart } from "@/lib/syllabus";
import type { CurriculumSubject, CurriculumVersion } from "@/services/api/curriculum-api";
import type { SyllabusLanguage } from "@/services/api/syllabus-api";

/** Reja qatorlari fan bo'yicha: ko'p semestrli fan bitta guruh (semestrlar tartibida), guruhlar reja tartibida. */
export const groupBySubject = (subjects: CurriculumSubject[]) => Object.values(subjects.reduce<Record<string, CurriculumSubject[]>>((acc, s) => {
  const key = s.subjectId != null ? `s${s.subjectId}` : `i${s.id}`;
  (acc[key] ??= []).push(s);
  return acc;
}, {})).map((rows) => rows.sort((a, b) => a.semester - b.semester))
  .sort((a, b) => a[0].semester - b[0].semester
    || (a[0].planRowNumber ?? "~").localeCompare(b[0].planRowNumber ?? "~", undefined, { numeric: true })
    || a[0].subjectName.localeCompare(b[0].subjectName));

/** Fanning barcha semestrlari bo'yicha soatlar qisqa ko'rinishda: "M 30 · A 45 · L 45" (masofaviy: "Aud. 60"). */
export const hoursText = (rows: CurriculumSubject[]) => {
  const sum = (key: keyof CurriculumSubject) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  const typed = ([["M", "lectureHours"], ["A", "practicalHours"], ["L", "laboratoryHours"], ["S", "seminarHours"]] as const)
    .map(([label, key]) => [label, sum(key)] as const).filter(([, value]) => value > 0);
  if (typed.length) return typed.map(([label, value]) => `${label} ${value}`).join(" · ");
  return sum("auditoryHours") > 0 ? `Aud. ${sum("auditoryHours")}` : "—";
};

/** Fanning rejadagi semestr qatorlari -> mavzular uchun reja limitlari (1-qism — birinchi semestr). */
export const planOf = (rows: CurriculumSubject[]): PlanPart[] => [...rows].sort((a, b) => a.semester - b.semester).map((r, i) => ({
  part: i + 1, semester: r.semester, lecture: r.lectureHours ?? 0, practical: r.practicalHours ?? 0,
  laboratory: r.laboratoryHours ?? 0, seminar: r.seminarHours ?? 0, auditory: r.auditoryHours ?? 0,
}));

/** O'quv reja tili ("uz-Latn", "ru", ...) -> dastur tili. */
export const syllabusLanguageOf = (language?: string | null): SyllabusLanguage => {
  const code = (language ?? "").toLowerCase();
  if (code.startsWith("uz-cyrl")) return "UZ_CYRILLIC";
  if (code.startsWith("kaa")) return "KAA";
  if (code.startsWith("ru")) return "RU";
  if (code.startsWith("en")) return "EN";
  return "UZ";
};

export const curriculumLabel = (c: Pick<CurriculumVersion, "programName" | "versionCode" | "academicYear">) =>
  `${c.programName} · ${c.versionCode} · ${c.academicYear}`;
