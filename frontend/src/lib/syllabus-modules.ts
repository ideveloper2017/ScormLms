import type { SubjectSyllabus, SyllabusModuleInput } from "@/services/api/syllabus-api";

/** Saqlangan tuzilmadan tahrir holati; modulga biriktirilmagan (eski) darslar alohida modulga yig'iladi */
export const modulesOf = (item: SubjectSyllabus): SyllabusModuleInput[] => {
  const toLesson = (t: NonNullable<SubjectSyllabus["topics"]>[number]) => ({ id: t.id, type: t.type, title: t.title, description: t.description ?? null, part: t.part ?? null });
  const modules: SyllabusModuleInput[] = (item.modules ?? []).map((m) => ({ id: m.id, name: m.name, description: m.description ?? "", lessons: m.lessons.map(toLesson) }));
  const loose = (item.topics ?? []).filter((t) => t.moduleId == null);
  if (loose.length) modules.push({ name: "Modulga biriktirilmagan darslar", description: "", lessons: loose.map(toLesson) });
  return modules;
};
