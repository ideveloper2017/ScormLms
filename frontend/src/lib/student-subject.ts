import { modulesOf } from "@/lib/syllabus-modules";
import type { CurriculumSubject } from "@/services/api/curriculum-api";
import type { LearningContent, StudentLessonQuiz, StudentSyllabusLessons } from "@/services/api/study-plan-api";
import type { SubjectSyllabus, SyllabusTopicType } from "@/services/api/syllabus-api";
import type { Test } from "@/types/test.types";

/** done — hammasi bajarilgan; current — talaba hozir shu yerda; todo — keyin; empty — materiali hali yo'q */
export type LessonStatus = "done" | "current" | "todo" | "empty";

/** Dars materiali — kurs kontenti yoki dastur materiali (kurssiz o'qish) */
export interface LessonItem { id: number; title: string; contentType: LearningContent['contentType'] }

export interface SubjectLesson {
  key: string;
  title: string;
  description?: string | null;
  type?: SyllabusTopicType | null;
  hours?: number | null;
  /** O'quv dasturi darsi (kurssiz o'qishda o'qish sahifasi shu bo'yicha ochiladi) */
  topicId?: number | null;
  contents: LessonItem[];
  tests: Test[];
  /** Dastur darsi testlari (kurssiz) */
  quizzes: StudentLessonQuiz[];
  status: LessonStatus;
  /** Bosilganda ochiladigan material: birinchi bajarilmagani, bo'lmasa birinchisi */
  openContentId?: number;
}

export interface SubjectModule {
  key: string;
  title: string;
  description?: string | null;
  lessons: SubjectLesson[];
  status: "done" | "current" | "todo";
}

const TYPES: SyllabusTopicType[] = ["THEORETICAL", "PRACTICAL", "LABORATORY", "SEMINAR"];
const asType = (value?: string | null) => (TYPES as string[]).includes(value ?? "") ? value as SyllabusTopicType : null;

/**
 * Fan sahifasi lentasi: o'quv dasturi modullari va darslari (tasdiqlangan dastur bo'lsa), har darsga kursdagi
 * materiallar (dastur darsiga bog'langan kurs darsi orqali), testlar va talabaning bajarganlari.
 * Dastur bo'lmasa yoki kursda dasturga bog'lanmagan darslar bo'lsa — kurs tuzilmasi bo'yicha.
 */
export function buildSubjectModules(
  syllabus: SubjectSyllabus | undefined,
  contents: LearningContent[],
  completedIds: number[],
  tests: Test[],
): SubjectModule[] {
  const completed = new Set(completedIds);
  const testsOf = (items: LearningContent[]) => {
    const moduleIds = new Set(items.map((c) => String(c.moduleId)));
    return tests.filter((t) => t.lessonId != null && moduleIds.has(t.lessonId));
  };
  const lesson = (key: string, title: string, items: LearningContent[], extra: Partial<SubjectLesson> = {}): Omit<SubjectLesson, "status"> => ({
    key, title, contents: items, tests: testsOf(items), quizzes: [],
    openContentId: (items.find((c) => !completed.has(c.id)) ?? items[0])?.id,
    ...extra,
  });
  const modules: { key: string; title: string; description?: string | null; lessons: Omit<SubjectLesson, "status">[] }[] = [];
  const used = new Set<number>();

  if (syllabus) {
    const hoursOf = new Map((syllabus.topics ?? []).map((t) => [t.id, t.hours]));
    modulesOf(syllabus).forEach((module, index) => modules.push({
      key: `m-${module.id ?? index}`, title: module.name, description: module.description,
      lessons: module.lessons.map((topic, lessonIndex) => {
        const items = contents.filter((c) => topic.id != null && c.syllabusTopicId === topic.id);
        items.forEach((c) => used.add(c.id));
        return lesson(`t-${topic.id ?? `${index}-${lessonIndex}`}`, topic.title, items,
          { description: topic.description, type: topic.type, hours: hoursOf.get(topic.id), topicId: topic.id });
      }),
    }));
  }
  // Dasturga bog'lanmagan (o'qituvchi qo'shgan) darslar — kurs modullari bo'yicha
  const rest = contents.filter((c) => !used.has(c.id));
  const byUnit = new Map<string, LearningContent[]>();
  rest.forEach((c) => {
    const unit = c.unitTitle ?? (syllabus ? "Qo'shimcha materiallar" : "Darslar");
    byUnit.set(unit, [...(byUnit.get(unit) ?? []), c]);
  });
  byUnit.forEach((items, unit) => {
    const byLesson = new Map<number, LearningContent[]>();
    items.forEach((c) => byLesson.set(c.moduleId, [...(byLesson.get(c.moduleId) ?? []), c]));
    modules.push({
      key: `u-${unit}`, title: unit,
      lessons: [...byLesson.values()].map((group) => lesson(`l-${group[0].moduleId}`, group[0].moduleTitle, group, { type: asType(group[0].topicType) })),
    });
  });

  return withStatus(modules, (item) => item.contents.every((c) => completed.has(c.id)) && item.tests.every((t) => t.status === "completed"));
}

type DraftModule = { key: string; title: string; description?: string | null; lessons: Omit<SubjectLesson, "status">[] };

/** Holat: hamma materiali (va testi) bajarilgani — done; birinchi tugallanmagani — current */
function withStatus(modules: DraftModule[], isDone: (lesson: Omit<SubjectLesson, "status">) => boolean): SubjectModule[] {
  let currentFound = false;
  return modules.filter((m) => m.lessons.length > 0).map((module) => {
    const lessons: SubjectLesson[] = module.lessons.map((item) => {
      const hasItems = item.contents.length + item.tests.length + item.quizzes.length > 0;
      const done = hasItems && item.contents.length + item.tests.length > 0 && isDone(item);
      let status: LessonStatus = !hasItems ? "empty" : done ? "done" : "todo";
      if (status === "todo" && !currentFound) { status = "current"; currentFound = true; }
      return { ...item, status };
    });
    const withItems = lessons.filter((l) => l.status !== "empty");
    const status = lessons.some((l) => l.status === "current") ? "current"
      : withItems.length > 0 && withItems.every((l) => l.status === "done") ? "done" : "todo";
    return { key: module.key, title: module.title, description: module.description, lessons, status };
  });
}

/**
 * Kurssiz o'qish: tasdiqlangan o'quv dasturi modullari va darslari, har darsda dastur materiallari va testlari,
 * talaba bajargan materiallar bo'yicha holat (testlar ishlanishi keyingi bosqichda — holatga ta'sir qilmaydi).
 */
export function buildSyllabusModules(syllabus: SubjectSyllabus, data: StudentSyllabusLessons | undefined): SubjectModule[] {
  const completed = new Set(data?.completedMaterialIds ?? []);
  const hoursOf = new Map((syllabus.topics ?? []).map((t) => [t.id, t.hours]));
  const modules: DraftModule[] = modulesOf(syllabus).map((module, index) => ({
    key: `m-${module.id ?? index}`, title: module.name, description: module.description,
    lessons: module.lessons.map((topic, lessonIndex) => {
      const items = (data?.materials ?? []).filter((m) => m.topicId === topic.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
      return {
        key: `t-${topic.id ?? `${index}-${lessonIndex}`}`, title: topic.title, description: topic.description, type: topic.type,
        hours: hoursOf.get(topic.id), topicId: topic.id, contents: items, tests: [],
        quizzes: (data?.quizzes ?? []).filter((q) => q.topicId === topic.id),
        openContentId: (items.find((m) => !completed.has(m.id)) ?? items[0])?.id,
      };
    }),
  }));
  return withStatus(modules, (item) => item.contents.every((c) => completed.has(c.id)));
}

/** Mashg'ulot turlari bo'yicha: jami darslar va bajarilganlari */
export function typeStats(modules: SubjectModule[]) {
  const lessons = modules.flatMap((m) => m.lessons);
  return TYPES.map((type) => {
    const ofType = lessons.filter((l) => l.type === type);
    return { type, total: ofType.length, done: ofType.filter((l) => l.status === "done").length };
  }).filter((s) => s.total > 0);
}

/** Rejadagi soatlar (ko'p semestrli fanda shu semestr qatori) mashg'ulot turlari bo'yicha */
export function planHours(row: CurriculumSubject) {
  return [
    { label: "Nazariy (ma'ruza)", hours: row.lectureHours ?? 0 },
    { label: "Amaliy", hours: row.practicalHours ?? 0 },
    { label: "Laboratoriya", hours: row.laboratoryHours ?? 0 },
    { label: "Seminar", hours: row.seminarHours ?? 0 },
    { label: "Mustaqil ta'lim", hours: row.selfStudyHours ?? 0 },
  ].filter((h) => h.hours > 0);
}

/** Matndagi qatorlar ro'yxati (talablar, natijalar) */
export const linesOf = (text?: string | null) =>
  (text ?? "").split(/\r?\n/).map((line) => line.replace(/^\s*[-•*\d.)]+\s*/, "").trim()).filter(Boolean);

/** Yaqin muddatlar: bajarilmagan testlar sanasi bo'yicha */
export function upcomingDeadlines(tests: Test[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return tests
    .filter((t) => t.status !== "completed" && t.status !== "missed" && new Date(t.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);
}
