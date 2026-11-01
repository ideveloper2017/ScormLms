import type { SubjectSyllabus, SyllabusModuleInput } from "@/services/api/syllabus-api";

/** Saqlangan tuzilmadan tahrir holati; modulga biriktirilmagan (eski) darslar alohida modulga yig'iladi */
export const modulesOf = (item: SubjectSyllabus): SyllabusModuleInput[] => {
  const toLesson = (t: NonNullable<SubjectSyllabus["topics"]>[number]) => ({ id: t.id, type: t.type, title: t.title, description: t.description ?? null, part: t.part ?? null });
  const modules: SyllabusModuleInput[] = (item.modules ?? []).map((m) => ({ id: m.id, name: m.name, description: m.description ?? "", lessons: m.lessons.map(toLesson) }));
  const loose = (item.topics ?? []).filter((t) => t.moduleId == null);
  if (loose.length) modules.push({ name: "Modulga biriktirilmagan darslar", description: "", lessons: loose.map(toLesson) });
  return modules;
};

/**
 * Ketma-ket elementlarni dastur moduli bo'yicha guruhlaydi (tartib saqlanadi). Dasturda modullar bo'lmasa
 * bitta nomsiz guruh qaytadi — sarlavha ko'rsatilmaydi; modulsiz elementlar `fallback` nomi ostida.
 */
export function groupBySyllabusModule<T>(items: T[], nameOf: (item: T) => string | null | undefined, fallback: string) {
  if (!items.some((item) => nameOf(item))) return [{ name: null as string | null, items }];
  const groups: { name: string | null; items: T[] }[] = [];
  for (const item of items) {
    const name = nameOf(item) || fallback;
    const last = groups[groups.length - 1];
    if (last?.name === name) last.items.push(item);
    else groups.push({ name, items: [item] });
  }
  return groups;
}
