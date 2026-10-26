import type { SyllabusLanguage, SyllabusTopic, SyllabusTopicInput, SyllabusTopicType } from "@/services/api/syllabus-api";

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

/** Turlar bo'yicha mavzular soni qisqa ko'rinishda: "Nazariy 4 · Laboratoriya 2" (mavzusi bor turlar). */
export function formatTypeCounts(topics: Pick<SyllabusTopic, "type">[]): string {
  return TOPIC_TYPES.map((type) => [type, topics.filter((t) => t.type === type).length] as const)
    .filter(([, count]) => count > 0).map(([type, count]) => `${topicTypeMeta[type].short} ${count}`).join(" · ");
}

/** Mavzular ro'yxatini tekshiradi; xato matni yoki null qaytaradi. */
export function validateTopics(topics: SyllabusTopicInput[]): string | null {
  const empty = topics.find((t) => t.title.trim().length < 2);
  return empty ? `${topicTypeMeta[empty.type].short} mavzu nomi kiritilmagan` : null;
}

/** Kredit-modul tizimi: 1 kredit = 30 akademik soat (auditoriya + mustaqil ta'lim). */
export const HOURS_PER_CREDIT = 30;

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

export const languageLabel = (language?: string | null) => syllabusLanguages.find((l) => l.value === language)?.label ?? language ?? "";
