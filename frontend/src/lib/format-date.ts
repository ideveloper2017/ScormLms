import { format, isValid, parseISO } from "date-fns";

/** Sana sifatida qabul qilinadigan qiymatlar: ISO satr, millisekund yoki Date. */
export type DateInput = string | number | Date | null | undefined;

const EMPTY = "—";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Qiymatni Date ga aylantiradi; bo'sh yoki noto'g'ri qiymat uchun null.
 * Faqat sana ("2026-09-15") mahalliy kun sifatida o'qiladi, shunda vaqt mintaqasi kunni surib yubormaydi.
 */
function toDate(value: DateInput): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date
    ? value
    : typeof value === "string" && DATE_ONLY.test(value) ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

function formatWith(pattern: string, value: DateInput, empty: string): string {
  const date = toDate(value);
  return date ? format(date, pattern) : empty;
}

/** dd.MM.yyyy — masalan 15.09.2026. Bo'sh yoki noto'g'ri qiymat uchun `empty` ("—"). */
export const formatDate = (value: DateInput, empty: string = EMPTY): string => formatWith("dd.MM.yyyy", value, empty);

/** dd.MM.yyyy HH:mm — masalan 15.09.2026 09:05. Bo'sh yoki noto'g'ri qiymat uchun `empty` ("—"). */
export const formatDateTime = (value: DateInput, empty: string = EMPTY): string => formatWith("dd.MM.yyyy HH:mm", value, empty);

/** HH:mm — masalan 09:05. Bo'sh yoki noto'g'ri qiymat uchun `empty` ("—"). */
export const formatTime = (value: DateInput, empty: string = EMPTY): string => formatWith("HH:mm", value, empty);
