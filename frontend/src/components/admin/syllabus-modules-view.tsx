import { topicTypeMeta } from "@/lib/syllabus";
import { modulesOf } from "@/lib/syllabus-modules";
import type { SubjectSyllabus } from "@/services/api/syllabus-api";

/** Dastur tuzilmasini faqat ko'rish: modullar va darslari (mashg'ulot turi bilan) */
export function SyllabusModulesView({ item }: { item: SubjectSyllabus }) {
  const modules = modulesOf(item);
  if (!modules.length) return <p className="text-sm text-muted-foreground">Modullar kiritilmagan.</p>;
  return <ol className="space-y-2">
    {modules.map((module, index) => <li key={module.id ?? `m-${index}`} className="rounded-md border p-2">
      <p className="font-medium">{index + 1}. {module.name}</p>
      {module.description && <p className="text-xs text-muted-foreground">{module.description}</p>}
      <ul className="mt-1 space-y-0.5 pl-4">
        {module.lessons.map((lesson, lessonIndex) => <li key={lesson.id ?? `l-${lessonIndex}`} className="flex items-center gap-2 text-sm">
          <span>{lessonIndex + 1}. {lesson.title}</span>
          <span className={`rounded border px-1.5 text-[10px] ${topicTypeMeta[lesson.type].badge}`}>{topicTypeMeta[lesson.type].short}</span>
          {lesson.part && <span className="text-[10px] text-muted-foreground">{lesson.part}-qism</span>}
        </li>)}
      </ul>
    </li>)}
  </ol>;
}
