import type { SyllabusLanguage, SyllabusTopicInput } from "@/services/api/syllabus-api";

/** Mavzular ro'yxatini tekshiradi; xato matni yoki null qaytaradi. */
export function validateTopics(topics: SyllabusTopicInput[]): string | null {
  const empty = topics.find((t) => t.title.trim().length < 2);
  if (empty) return `${empty.type === "THEORETICAL" ? "Nazariy" : "Amaliy"} mavzu nomi kiritilmagan`;
  const bad = topics.find((t) => !Number.isInteger(Number(t.hours)) || Number(t.hours) < 1 || Number(t.hours) > 200);
  return bad ? `"${bad.title.trim()}" mavzusi soati 1–200 oralig'ida bo'lishi kerak` : null;
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
