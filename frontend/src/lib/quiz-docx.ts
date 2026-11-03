import type { LessonQuizQuestion } from "@/services/api/syllabus-api";

/** Namuna fayl (public/templates) — formatni ko'rsatadi */
export const QUIZ_DOCX_TEMPLATE = "/templates/test-namuna.docx";

/**
 * Test matni (HEMIS / Everest formati): savollar "++++" qatori bilan, savol va variantlar "====" bilan ajratiladi,
 * to'g'ri variant oldiga "#" qo'yiladi. Bitta "#"li javobli savol — qisqa javob (bir nechta to'g'ri javob "|" bilan).
 * Javobsiz bloklar (sarlavha, izoh) tashlab yuboriladi.
 *
 *   Tezlik birligi?
 *   ====
 *   #m/s
 *   ====
 *   kg
 *   ++++
 *   1 km necha metr?
 *   ====
 *   #1000|1000 m
 */
export function parseQuizText(text: string): LessonQuizQuestion[] {
  const blocks: string[][] = [[]];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (/^\+{4,}$/.test(line)) blocks.push([]);
    else blocks[blocks.length - 1].push(raw);
  }
  // Word'dan olingan matnda paragraflar orasida bo'sh qator bo'ladi
  return blocks.map((lines) => lines.join("\n").split(/^\s*={4,}\s*$/m).map((part) => part.trim().replace(/\n\s*\n+/g, "\n")))
    // Javobsiz blok (sarlavha, izoh) savol emas
    .filter((parts) => parts[0] && parts.slice(1).some(Boolean))
    .map(([question, ...answers]): LessonQuizQuestion => {
      const options = answers.filter(Boolean);
      const correct = options.filter((o) => o.startsWith("#")).map((o) => o.slice(1).trim());
      const clean = options.map((o) => (o.startsWith("#") ? o.slice(1).trim() : o));
      if (clean.length === 1) return { text: question, type: "SHORT_ANSWER", options: [], correctAnswer: clean[0], explanation: "", points: 1 };
      // To'g'ri variant belgilanmagan yoki bir nechta bo'lsa — formada tekshiruv ko'rsatadi
      return { text: question, type: "SINGLE_CHOICE", options: clean, correctAnswer: correct.length === 1 ? correct[0] : "", explanation: "", points: 1 };
    });
}

/** .docx fayldan savollar (matn mammoth bilan olinadi, rasm va formulalar tushmaydi) */
export async function importQuizDocx(file: File): Promise<LessonQuizQuestion[]> {
  const { extractRawText } = await import("mammoth");
  const { value } = await extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return parseQuizText(value);
}
