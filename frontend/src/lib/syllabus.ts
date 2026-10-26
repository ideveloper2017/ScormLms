import type { SubjectSyllabus, SyllabusLanguage, SyllabusTopicInput, SyllabusTopicType } from "@/services/api/syllabus-api";

/** Mashg'ulot turlari tartibi — kursdagi bo'limlar ham shu tartibda bo'ladi (backend enum tartibi bilan bir xil). */
export const TOPIC_TYPES: SyllabusTopicType[] = ["THEORETICAL", "PRACTICAL", "LABORATORY", "SEMINAR"];

export const topicTypeMeta: Record<SyllabusTopicType, { short: string; badge: string; empty: string }> = {
  THEORETICAL: {
    short: "Nazariy",
    badge: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300",
    empty: "Nazariy (ma'ruza) mavzulari",
  },
  PRACTICAL: {
    short: "Amaliy",
    badge: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300",
    empty: "Amaliy mashg'ulot mavzulari",
  },
  LABORATORY: {
    short: "Laboratoriya",
    badge: "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300",
    empty: "Laboratoriya ishlari",
  },
  SEMINAR: {
    short: "Seminar",
    badge: "border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300",
    empty: "Seminar mavzulari",
  },
};

/** O'quv rejadagi fanning bitta semestri (qismi) soatlari — dastur mavzulari shu limitlarga taqsimlanadi. */
export interface PlanPart {
  part: number;
  semester: number;
  lecture: number;
  practical: number;
  laboratory: number;
  seminar: number;
  /** Auditoriya jami (masofaviy shaklda turlarga bo'linmagan) */
  auditory: number;
}

const PLAN_FIELD: Record<SyllabusTopicType, keyof Pick<PlanPart, "lecture" | "practical" | "laboratory" | "seminar">> = {
  THEORETICAL: "lecture", PRACTICAL: "practical", LABORATORY: "laboratory", SEMINAR: "seminar",
};

/** Reja limiti: tur bo'yicha soat (null — rejada turlarga bo'linmagan, faqat auditoriya jami). */
export function planHours(parts: PlanPart[], type: SyllabusTopicType): number | null {
  const typed = parts.reduce((sum, p) => sum + p.lecture + p.practical + p.laboratory + p.seminar, 0);
  return typed === 0 ? null : parts.reduce((sum, p) => sum + p[PLAN_FIELD[type]], 0);
}

/** Faqat soati bor turlarni qisqa ko'rinishda: "Nazariy 4 · Laboratoriya 2". */
export function formatTypeHours(hours: Partial<Record<SyllabusTopicType, number>>): string {
  const parts = TOPIC_TYPES.filter((type) => (hours[type] ?? 0) > 0).map((type) => `${topicTypeMeta[type].short} ${hours[type]}`);
  return parts.length ? parts.join(" · ") : "0";
}

/** Dastur DTO'sidagi turlar bo'yicha soatlar. */
export function syllabusTypeHours(s: Pick<SubjectSyllabus, "theoreticalHours" | "practicalHours" | "laboratoryHours" | "seminarHours">) {
  return {
    THEORETICAL: s.theoreticalHours ?? 0, PRACTICAL: s.practicalHours ?? 0,
    LABORATORY: s.laboratoryHours ?? 0, SEMINAR: s.seminarHours ?? 0,
  } satisfies Record<SyllabusTopicType, number>;
}

/** Mavzular ro'yxatini tekshiradi; xato matni yoki null qaytaradi. */
export function validateTopics(topics: SyllabusTopicInput[]): string | null {
  const empty = topics.find((t) => t.title.trim().length < 2);
  if (empty) return `${topicTypeMeta[empty.type].short} mavzu nomi kiritilmagan`;
  const bad = topics.find((t) => !Number.isInteger(Number(t.hours)) || Number(t.hours) < 1 || Number(t.hours) > 200);
  return bad ? `"${bad.title.trim()}" mavzusi soati 1–200 oralig'ida bo'lishi kerak` : null;
}

/** Kredit-modul tizimi: 1 kredit = 30 akademik soat (auditoriya + mustaqil ta'lim). */
export const HOURS_PER_CREDIT = 30;

/** Fan yuklamasi: umumiy soat, auditoriya (barcha mashg'ulot turlari) va qolgan mustaqil ta'lim soati. */
export function creditWorkload(credits: number, auditoryHours: number) {
  const total = credits * HOURS_PER_CREDIT;
  return { total, auditory: auditoryHours, selfStudy: total - auditoryHours, exceeded: auditoryHours > total };
}

/** Dastur tilidan kurs tili (kurs faqat uz/ru/en tillarini qo'llaydi). */
export function courseLanguageOf(language: SyllabusLanguage): "uz" | "ru" | "en" {
  return language === "RU" ? "ru" : language === "EN" ? "en" : "uz";
}

export const syllabusLanguages: { value: SyllabusLanguage; label: string }[] = [
  { value: "UZ", label: "O'zbekcha" },
  { value: "EN", label: "English" },
  { value: "RU", label: "Русский" },
  { value: "KAA", label: "Qaraqalpaqsha" },
  { value: "UZ_CYRILLIC", label: "Ўзбекча" },
];
