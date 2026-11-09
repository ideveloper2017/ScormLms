import { useState, type ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, ClipboardCheck, Code2, FileText, FolderOpen, Image as ImageIcon,
  Link as LinkIcon, Loader2, MoreVertical, Pencil, Plus, Trash2, Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LazyRichTextEditor } from "@/components/editor/lazy-rich-text-editor";
import { isRichTextEmpty, richTextToPlainText } from "@/components/editor/rich-text-utils";
import type { OpenLesson } from "@/components/admin/syllabus-lesson-page";
import { PlanTopicsCheck } from "@/components/admin/syllabus-topics";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { TOPIC_TYPES, planHours, topicTypeMeta, type PlanPart } from "@/lib/syllabus";
import { modulesOf } from "@/lib/syllabus-modules";
import {
  syllabusApi, type LessonMaterialType, type SubjectSyllabus, type SyllabusModuleInput, type SyllabusTopicInput, type SyllabusTopicType,
} from "@/services/api/syllabus-api";
import type { SubjectMaterial } from "@/services/api/teacher-portal-api";

const select = "h-10 rounded-md border bg-background px-3 text-sm";

/** Dars qo'shishda birinchi kontent turi (Mentor LMS kabi); "none" — kontentsiz, keyin "Resurslar"dan qo'shiladi */
type LessonKind = "video_file" | "video_url" | "document" | "image" | "text" | "embed" | "none";
const LESSON_KINDS: { value: LessonKind; label: string; icon: ElementType; material?: LessonMaterialType; file?: string; url?: boolean }[] = [
  { value: "video_file", label: "Video fayl", icon: Video, material: "VIDEO", file: "video/mp4,video/webm" },
  { value: "video_url", label: "Video havola", icon: LinkIcon, material: "VIDEO", url: true },
  { value: "document", label: "Hujjat fayl", icon: FileText, material: "DOCUMENT", file: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" },
  { value: "image", label: "Rasm fayl", icon: ImageIcon, material: "FILE", file: "image/jpeg,image/png,image/webp,image/gif" },
  { value: "text", label: "Matn", icon: FileText, material: "TEXT" },
  { value: "embed", label: "Embed / havola", icon: Code2, material: "LINK", url: true },
  { value: "none", label: "Faqat dars (kontentsiz)", icon: FolderOpen },
];

const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list]; const [value] = copy.splice(from, 1); copy.splice(to, 0, value); return copy;
};
const clean = (modules: SyllabusModuleInput[]): SyllabusModuleInput[] => modules.map((m) => ({
  id: m.id ?? null, name: m.name.trim(), description: m.description?.trim() || null,
  lessons: m.lessons.map((l) => ({ id: l.id ?? null, type: l.type, title: l.title.trim(), description: l.description?.trim() || null, part: l.part ?? null })),
}));

type Dialogs =
  | { kind: "section"; index?: number }
  | { kind: "sortSections" }
  | { kind: "lesson"; module: number; lesson?: number }
  | { kind: "sortLessons"; module: number }
  | { kind: "quiz"; module: number }
  | { kind: "delete"; module: number; lesson?: number };

/**
 * O'quv dasturi (Mentor LMS "Curriculum" kabi): bo'limlar (modullar) ro'yxati, har birida "Bo'lim menyusi" —
 * dars qo'shish, darslarni saralash, test qo'shish, tahrirlash, o'chirish; darsda ⋮ — resurslar, tahrirlash, o'chirish.
 * Har amal darhol saqlanadi (bog'langan qoralama kurslar ham moslanadi).
 */
export function SyllabusCurriculum({ item, editable, plan, onSaved, counts, onCount, onOpenLesson }: {
  item: SubjectSyllabus;
  editable: boolean;
  plan?: PlanPart[];
  onSaved: (value: SubjectSyllabus) => unknown;
  /** Dars kontenti sahifasidagi o'zgarishdan keyingi material + test soni */
  counts: Record<number, number>;
  onCount: (lessonId: number, count: number) => void;
  onOpenLesson: (lesson: OpenLesson) => void;
}) {
  const { toast } = useToast();
  const modules = modulesOf(item);
  const lessons = modules.flatMap((m) => m.lessons);
  const parts = Math.max(plan?.length ?? 0, ...lessons.map((l) => l.part ?? 1), 1);
  // Rejadan ochilganda: faqat rejada soati bor turlar (turlarga bo'linmagan rejada — barchasi)
  const types: SyllabusTopicType[] = plan?.length && TOPIC_TYPES.some((type) => planHours(plan, type) !== null)
    ? TOPIC_TYPES.filter((type) => (planHours(plan, type) ?? 0) > 0 || lessons.some((l) => l.type === type))
    : TOPIC_TYPES;
  const [opened, setOpened] = useState<Set<number>>(() => new Set([0]));
  const [dialog, setDialog] = useState<Dialogs | null>(null);
  const resourceCount = (id: number) => {
    const topic = item.topics?.find((t) => t.id === id);
    return counts[id] ?? (topic?.materialCount ?? 0) + (topic?.quizCount ?? 0);
  };
  const toggle = (index: number) => setOpened((value) => { const next = new Set(value); if (next.has(index)) next.delete(index); else next.add(index); return next; });

  const save = useMutation({
    mutationFn: ({ next }: { next: SyllabusModuleInput[]; title: string; keepOpen?: boolean }) => syllabusApi.updateModulesWithCourses(item.id, clean(next)),
    onSuccess: async (result, { title, keepOpen }) => {
      await onSaved(result.syllabus);
      const changed = result.courses.filter((c) => c.added + c.updated > 0);
      toast({ title, description: changed.length ? changed.map((c) => `«${c.title}» kursi ham moslandi`).join("; ") : undefined });
      if (!keepOpen) setDialog(null);
    },
    onError: (e) => toast({ variant: "destructive", title: "Saqlanmadi", description: extractApiError(e, "Saqlanmadi").message }),
  });
  const commit = (next: SyllabusModuleInput[], title: string, keepOpen = false) => save.mutateAsync({ next, title, keepOpen });
  const withModule = (index: number, change: (module: SyllabusModuleInput) => SyllabusModuleInput) =>
    modules.map((m, i) => (i === index ? change(m) : m));

  return <div className="space-y-4">
    {plan?.length ? <PlanTopicsCheck topics={lessons} plan={plan} noun="dars" /> : null}
    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
      <p className="text-sm text-muted-foreground">{modules.length} bo'lim · {lessons.length} dars</p>
      {editable && <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setDialog({ kind: "section" })}><Plus className="mr-1.5 h-4 w-4" />Bo'lim qo'shish</Button>
        <Button variant="secondary" disabled={modules.length < 2} onClick={() => setDialog({ kind: "sortSections" })}><ArrowUpDown className="mr-1.5 h-4 w-4" />Bo'limlarni saralash</Button>
      </div>}
    </div>

    {modules.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      Hali bo'lim yo'q. Dastur bo'limlardan (modullardan), bo'limlar darslardan iborat.</p>}

    {modules.map((module, index) => {
      const expanded = opened.has(index);
      return <section key={module.id ?? `new-${index}`} aria-label={`${index + 1}. ${module.name}`} className="overflow-hidden rounded-xl border">
        <div className={`flex items-center gap-2 px-4 py-3 ${expanded ? "bg-muted/50" : ""}`}>
          <button type="button" aria-expanded={expanded} onClick={() => toggle(index)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className="truncate font-medium">{index + 1}. {module.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{module.lessons.length} dars</span>
            {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          </button>
          {editable && <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="secondary" size="sm">Bo'lim menyusi<ChevronDown className="ml-1.5 h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDialog({ kind: "lesson", module: index })}><Plus className="mr-2 h-4 w-4" />Dars qo'shish</DropdownMenuItem>
              <DropdownMenuItem disabled={module.lessons.length < 2} onSelect={() => setDialog({ kind: "sortLessons", module: index })}><ArrowUpDown className="mr-2 h-4 w-4" />Darslarni saralash</DropdownMenuItem>
              <DropdownMenuItem disabled={!module.lessons.some((l) => l.id)} onSelect={() => setDialog({ kind: "quiz", module: index })}><ClipboardCheck className="mr-2 h-4 w-4" />Test qo'shish</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog({ kind: "section", index })}><Pencil className="mr-2 h-4 w-4" />Bo'limni tahrirlash</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog({ kind: "delete", module: index })}><Trash2 className="mr-2 h-4 w-4" />Bo'limni o'chirish</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>
        {expanded && <div className="space-y-2 p-3">
          {module.description && <p className="px-1 text-xs text-muted-foreground">{module.description}</p>}
          {module.lessons.length === 0 && <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">Bo'limda dars yo'q.</p>}
          {module.lessons.map((lesson, lessonIndex) => {
            const open = () => lesson.id && onOpenLesson({ id: lesson.id, title: lesson.title, type: lesson.type, moduleName: module.name });
            return <div key={lesson.id ?? `l-${lessonIndex}`} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <button type="button" onClick={open} aria-label={`${index + 1}-bo'lim ${lessonIndex + 1}-dars: ${lesson.title}`}
                className="min-w-0 flex-1 truncate text-left text-sm hover:underline">{lesson.title}</button>
              <Badge variant="outline" className="shrink-0">{topicTypeMeta[lesson.type].short}</Badge>
              {parts > 1 && <Badge variant="secondary" className="shrink-0">{lesson.part ?? 1}-qism</Badge>}
              {lesson.id && <span className="shrink-0 text-xs text-muted-foreground">{resourceCount(lesson.id)} resurs</span>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${lesson.title} — menyu`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={!lesson.id} onSelect={open}><FolderOpen className="mr-2 h-4 w-4" />Resurslar va testlar</DropdownMenuItem>
                  {editable && <>
                    <DropdownMenuItem onSelect={() => setDialog({ kind: "lesson", module: index, lesson: lessonIndex })}><Pencil className="mr-2 h-4 w-4" />Tahrirlash</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog({ kind: "delete", module: index, lesson: lessonIndex })}><Trash2 className="mr-2 h-4 w-4" />O'chirish</DropdownMenuItem>
                  </>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>;
          })}
        </div>}
      </section>;
    })}
    {!editable && <p className="text-xs text-muted-foreground">Dastur faqat qoralamada tahrirlanadi — dasturning yangi versiyasini oching.</p>}

    {dialog?.kind === "section" && <SectionDialog module={dialog.index != null ? modules[dialog.index] : undefined} busy={save.isPending}
      onClose={() => setDialog(null)}
      onSubmit={(name, description) => {
        const { index } = dialog;
        if (index == null) {
          setOpened((value) => new Set(value).add(modules.length));
          return commit([...modules, { name, description, lessons: [] }], "Bo'lim qo'shildi");
        }
        return commit(withModule(index, (m) => ({ ...m, name, description })), "Bo'lim saqlandi");
      }} />}
    {dialog?.kind === "sortSections" && <SortDialog title="Bo'limlarni saralash" items={modules.map((m) => m.name)} busy={save.isPending}
      onClose={() => setDialog(null)} onSubmit={(order) => commit(order.map((i) => modules[i]), "Bo'limlar tartibi saqlandi")} />}
    {dialog?.kind === "sortLessons" && <SortDialog title="Darslarni saralash" items={modules[dialog.module].lessons.map((l) => l.title)} busy={save.isPending}
      onClose={() => setDialog(null)}
      onSubmit={(order) => commit(withModule(dialog.module, (m) => ({ ...m, lessons: order.map((i) => m.lessons[i]) })), "Darslar tartibi saqlandi")} />}
    {dialog?.kind === "lesson" && <LessonDialog syllabusId={item.id} types={types} parts={parts}
      lesson={dialog.lesson != null ? modules[dialog.module].lessons[dialog.lesson] : undefined}
      onClose={() => setDialog(null)}
      onSubmit={async (lesson) => {
        const { module, lesson: lessonIndex } = dialog;
        if (lessonIndex != null) {
          await commit(withModule(module, (m) => ({ ...m, lessons: m.lessons.map((l, i) => (i === lessonIndex ? { ...l, ...lesson } : l)) })), "Dars saqlandi", true);
          return lesson.id ?? null;
        }
        const result = await commit(withModule(module, (m) => ({ ...m, lessons: [...m.lessons, lesson] })), "Dars qo'shildi", true);
        setOpened((value) => new Set(value).add(module));
        return modulesOf(result.syllabus)[module]?.lessons.at(-1)?.id ?? null;
      }}
      onContent={(lessonId) => onCount(lessonId, resourceCount(lessonId) + 1)} />}
    {dialog?.kind === "quiz" && <QuizDialog lessons={modules[dialog.module].lessons.filter((l) => l.id)} onClose={() => setDialog(null)}
      onSubmit={(lesson) => { setDialog(null); onOpenLesson({ id: lesson.id!, title: lesson.title, type: lesson.type, moduleName: modules[dialog.module].name }); }} />}
    {dialog?.kind === "delete" && <ConfirmDialog busy={save.isPending} onClose={() => setDialog(null)}
      title={dialog.lesson != null ? "Darsni o'chirish" : "Bo'limni o'chirish"}
      text={dialog.lesson != null
        ? `«${modules[dialog.module].lessons[dialog.lesson].title}» darsi va uning resurslari o'chiriladi.`
        : `«${modules[dialog.module].name}» bo'limi va undagi ${modules[dialog.module].lessons.length} ta dars o'chiriladi.`}
      onConfirm={() => {
        const { module, lesson } = dialog;
        return lesson != null
          ? commit(withModule(module, (m) => ({ ...m, lessons: m.lessons.filter((_, i) => i !== lesson) })), "Dars o'chirildi")
          : commit(modules.filter((_, i) => i !== module), "Bo'lim o'chirildi");
      }} />}
  </div>;
}

function SectionDialog({ module, busy, onClose, onSubmit }: {
  module?: SyllabusModuleInput; busy: boolean; onClose: () => void; onSubmit: (name: string, description: string) => Promise<unknown>;
}) {
  const [name, setName] = useState(module?.name ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const invalid = name.trim().length < 3;
  return <Dialog open onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{module ? "Bo'limni tahrirlash" : "Bo'lim qo'shish"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="sc-name">Bo'lim nomi *</Label>
          <Input id="sc-name" autoFocus value={name} maxLength={255} placeholder="Bo'lim nomini kiriting" onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="sc-description">Qisqa ma'lumot</Label>
          <Textarea id="sc-description" rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Yopish</Button>
        <Button disabled={invalid || busy} title={invalid ? "Nomi kamida 3 belgi" : undefined} onClick={() => void onSubmit(name.trim(), description.trim()).catch(() => undefined)}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function SortDialog({ title, items, busy, onClose, onSubmit }: {
  title: string; items: string[]; busy: boolean; onClose: () => void; onSubmit: (order: number[]) => Promise<unknown>;
}) {
  const [order, setOrder] = useState(() => items.map((_, i) => i));
  return <Dialog open onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <ol aria-label={title} className="max-h-[60vh] space-y-1.5 overflow-y-auto">
        {order.map((itemIndex, position) => <li key={itemIndex} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="w-6 text-muted-foreground">{position + 1}.</span><span className="flex-1">{items[itemIndex]}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${items[itemIndex]} — yuqoriga`} disabled={position === 0}
            onClick={() => setOrder((value) => move(value, position, position - 1))}><ArrowUp className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${items[itemIndex]} — pastga`} disabled={position === order.length - 1}
            onClick={() => setOrder((value) => move(value, position, position + 1))}><ArrowDown className="h-3.5 w-3.5" /></Button>
        </li>)}
      </ol>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Yopish</Button>
        <Button disabled={busy} onClick={() => void onSubmit(order).catch(() => undefined)}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

/** "hh:mm:ss", "mm:ss" yoki soniya → soniya; noto'g'ri bo'lsa NaN, bo'sh bo'lsa null */
const parseDuration = (value: string): number | null => {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d{1,3}(:\d{1,2}){0,2}$/.test(text)) return NaN;
  return text.split(":").map(Number).reduce((sum, part) => sum * 60 + part, 0);
};
const formatDuration = (seconds?: number | null) => {
  if (!seconds) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
};
type Provider = "youtube" | "vimeo" | "mp4";
const PROVIDERS: { value: Provider; label: string; test: RegExp; hint: string }[] = [
  { value: "youtube", label: "YouTube", test: /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i, hint: "https://youtu.be/..." },
  { value: "vimeo", label: "Vimeo", test: /^https?:\/\/(www\.|player\.)?vimeo\.com\//i, hint: "https://vimeo.com/..." },
  { value: "mp4", label: "MP4 / WebM havola", test: /^https?:\/\/\S+\.(mp4|webm)(\?\S*)?$/i, hint: "https://.../video.mp4" },
];
const providerOf = (url?: string | null): Provider => /vimeo\.com/i.test(url ?? "") ? "vimeo" : /\.(mp4|webm)(\?|$)/i.test(url ?? "") ? "mp4" : "youtube";
/** Mavjud material turidan dars turi (tahrirlashda) */
const kindOf = (material: SubjectMaterial): LessonKind => {
  const type = material.contentType.toLowerCase();
  if (type === "video") return material.asset ? "video_file" : "video_url";
  if (type === "text") return "text";
  if (type === "link") return "embed";
  if (type === "file" && material.asset?.mediaType.startsWith("image/")) return "image";
  return "document";
};

/**
 * Dars qo'shish / tahrirlash (Mentor LMS "Add / Update Lesson" kabi, bitta ustun): 1-qadam — dars turi; 2-qadam —
 * nomi, mashg'ulot turi, qism, kontent (video manbasi va ulashish havolasi, fayl yoki matn), davomiyligi va xulosa.
 * Tahrirlashda darsning asosiy (birinchi) materiali ham shu yerda o'zgartiriladi.
 */
function LessonDialog({ syllabusId, types, parts, lesson, onClose, onSubmit, onContent }: {
  syllabusId: number; types: SyllabusTopicType[]; parts: number; lesson?: SyllabusTopicInput;
  onClose: () => void;
  /** Darsni saqlaydi; yangi bo'lsa — uning id'si */
  onSubmit: (lesson: SyllabusTopicInput) => Promise<number | null>;
  onContent: (lessonId: number) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const materialsKey = ["syllabus", syllabusId, "lesson", lesson?.id, "materials"];
  const existing = useQuery({ queryKey: materialsKey, queryFn: () => syllabusApi.lessonMaterials(syllabusId, lesson!.id!), enabled: Boolean(lesson?.id) });
  const material = existing.data?.[0];
  const [step, setStep] = useState<1 | 2>(lesson ? 2 : 1);
  const [kind, setKind] = useState<LessonKind>(lesson ? "none" : "video_url");
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [type, setType] = useState<SyllabusTopicType>(lesson?.type ?? types[0]);
  const [part, setPart] = useState(lesson?.part ?? 1);
  const [summary, setSummary] = useState(lesson?.description ?? "");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<Provider>("youtube");
  const [duration, setDuration] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tahrirlashda mavjud material bilan to'ldiriladi (bir marta)
  const [loadedId, setLoadedId] = useState<number | null>(null);
  if (material && loadedId !== material.id) {
    setLoadedId(material.id);
    setKind(kindOf(material));
    setUrl(material.contentUrl ?? "");
    setProvider(providerOf(material.contentUrl));
    setBody(material.contentBody ?? "");
    setDuration(formatDuration(material.durationSeconds));
    if (material.description) setSummary(material.description);
  }
  const meta = LESSON_KINDS.find((k) => k.value === kind)!;
  const isVideo = kind === "video_file" || kind === "video_url";
  // Tahrirlashda shu turdagi mavjud fayl saqlanadi (yangisi tanlanmasa)
  const keptAsset = material && kindOf(material) === kind && !file ? material.asset ?? null : null;
  const seconds = parseDuration(duration);
  const providerMeta = PROVIDERS.find((p) => p.value === provider)!;
  const invalid = title.trim().length < 2 ? "Dars nomini kiriting"
    : kind === "none" ? null
      : meta.file && !file && !keptAsset ? "Faylni tanlang"
        : kind === "video_url" && !providerMeta.test.test(url.trim()) ? `${providerMeta.label} ulashish havolasini kiriting`
          : kind === "embed" && !/^https?:\/\/\S+$/i.test(url.trim()) ? "Havola http(s):// bilan boshlanishi kerak"
            : kind === "text" && isRichTextEmpty(body) ? "Dars matnini kiriting"
              : isVideo && Number.isNaN(seconds) ? "Davomiylik 00:00:00 ko'rinishida bo'lsin" : null;
  const save = useMutation({
    mutationFn: async () => {
      const lessonId = await onSubmit({
        id: lesson?.id ?? null, title: title.trim(), type,
        description: isRichTextEmpty(summary) ? null : richTextToPlainText(summary).slice(0, 2000), part: parts > 1 ? part : null,
      });
      if (kind === "none" || lessonId == null) return;
      try {
        const asset = file ? await syllabusApi.uploadLessonAsset(syllabusId, file) : null;
        const input = {
          title: title.trim(), description: isRichTextEmpty(summary) ? null : summary, contentType: meta.material!,
          contentBody: kind === "text" ? body : null, contentUrl: meta.url ? url.trim() : null,
          assetId: asset?.id ?? keptAsset?.id ?? null, durationSeconds: isVideo ? seconds : null,
        };
        if (material) await syllabusApi.updateLessonMaterial(syllabusId, lessonId, material.id, input);
        else { await syllabusApi.createLessonMaterial(syllabusId, lessonId, input); onContent(lessonId); }
        await queryClient.invalidateQueries({ queryKey: ["syllabus", syllabusId, "lesson", lessonId, "materials"] });
      } catch (cause) {
        toast({ variant: "destructive", title: "Dars saqlandi, lekin kontent saqlanmadi", description: extractApiError(cause, "Kontent saqlanmadi").message + " — darsning «Resurslar» bo'limidan qayta urinib ko'ring." });
      }
    },
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });

  return <Dialog open onOpenChange={(value) => !value && !save.isPending && onClose()}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>{lesson ? "Darsni tahrirlash" : "Dars qo'shish"}</DialogTitle></DialogHeader>
      {step === 1 ? <div className="space-y-2">
        <p className="text-sm font-medium">Dars turi</p>
        <div role="radiogroup" aria-label="Dars turi" className="grid gap-2 sm:grid-cols-2">
          {LESSON_KINDS.map((k) => <label key={k.value} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${kind === k.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <input type="radio" name="lesson-kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="accent-primary" />
            <k.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{k.label}
          </label>)}
        </div>
      </div> : <div className="max-h-[68vh] space-y-4 overflow-y-auto px-0.5 pb-1">
        {lesson && existing.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Kontent yuklanmoqda...</p>}
        <div className="space-y-1.5"><Label htmlFor="ld-title">Nomi *</Label>
          <Input id="ld-title" autoFocus value={title} maxLength={500} placeholder="Dars nomi" onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="ld-type">Mashg'ulot turi *</Label>
            <select id="ld-type" className={`${select} w-full`} value={type} onChange={(e) => setType(e.target.value as SyllabusTopicType)}>
              {types.map((t) => <option key={t} value={t}>{topicTypeMeta[t].short}</option>)}
            </select></div>
          {parts > 1 ? <div className="space-y-1.5"><Label htmlFor="ld-part">Qism (semestr)</Label>
            <select id="ld-part" className={`${select} w-full`} value={part} onChange={(e) => setPart(Number(e.target.value))}>
              {Array.from({ length: parts }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}-qism</option>)}
            </select></div>
            : lesson && <div className="space-y-1.5"><Label htmlFor="ld-kind">Dars turi</Label>
              <select id="ld-kind" className={`${select} w-full`} value={kind} onChange={(e) => { setKind(e.target.value as LessonKind); setFile(null); }}>
                {LESSON_KINDS.filter((k) => !(material && k.value === "none")).map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select></div>}
        </div>
        {lesson && parts > 1 && <div className="space-y-1.5"><Label htmlFor="ld-kind">Dars turi</Label>
          <select id="ld-kind" className={`${select} w-full`} value={kind} onChange={(e) => { setKind(e.target.value as LessonKind); setFile(null); }}>
            {LESSON_KINDS.filter((k) => !(material && k.value === "none")).map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select></div>}

        {kind === "video_url" && <>
          <div className="space-y-1.5"><Label htmlFor="ld-provider">Video manbasi</Label>
            <select id="ld-provider" className={`${select} w-full`} value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select></div>
          <div className="space-y-1.5"><Label htmlFor="ld-url">Video havolasi <span className="text-xs font-normal text-muted-foreground">(faqat ulashish havolasi)</span></Label>
            <Input id="ld-url" value={url} placeholder={providerMeta.hint} onChange={(e) => setUrl(e.target.value)} /></div>
        </>}
        {kind === "embed" && <div className="space-y-1.5"><Label htmlFor="ld-url">Havola (sayt, YouTube, Vimeo) *</Label>
          <Input id="ld-url" value={url} placeholder="https://..." onChange={(e) => setUrl(e.target.value)} /></div>}
        {meta.file && <div className="space-y-1.5"><Label htmlFor="ld-file">{meta.label}{keptAsset ? "" : " *"}</Label>
          <Input id="ld-file" type="file" accept={meta.file} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {keptAsset && <p className="text-xs text-muted-foreground">Joriy fayl: {keptAsset.originalFileName} — almashtirish uchun yangisini tanlang</p>}</div>}
        {kind === "text" && <div className="space-y-1.5"><Label>Dars matni *</Label>
          <LazyRichTextEditor value={body} onChange={setBody} placeholder="Dars mazmunini yozing..." /></div>}
        {isVideo && <div className="space-y-1.5"><Label htmlFor="ld-duration">Davomiyligi</Label>
          <Input id="ld-duration" value={duration} placeholder="00:00:00" inputMode="numeric" onChange={(e) => setDuration(e.target.value)} /></div>}
        <div className="space-y-1.5"><Label>Xulosa</Label>
          <LazyRichTextEditor value={summary} onChange={setSummary} placeholder="Dars haqida qisqacha: nimalar o'rganiladi, natijasi..." /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>}
      <DialogFooter className="items-center gap-2 sm:justify-between">
        <Button variant="outline" disabled={save.isPending} onClick={onClose}>Yopish</Button>
        <div className="flex items-center gap-2">
          {step === 2 && invalid && <span className="text-xs text-muted-foreground">{invalid}</span>}
          {step === 2 && !lesson && <Button variant="outline" disabled={save.isPending} onClick={() => setStep(1)}>Orqaga</Button>}
          {step === 1 ? <Button onClick={() => setStep(2)}>Keyingi</Button>
            : <Button disabled={!!invalid || save.isPending || (Boolean(lesson) && existing.isLoading)} title={invalid ?? undefined} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{lesson ? "Darsni saqlash" : "Dars qo'shish"}</Button>}
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

/** Test darsga biriktiriladi: dars tanlanadi va uning sahifasida savollar kiritiladi (.docx import ham bor) */
function QuizDialog({ lessons, onClose, onSubmit }: { lessons: SyllabusTopicInput[]; onClose: () => void; onSubmit: (lesson: SyllabusTopicInput) => void }) {
  const [id, setId] = useState(lessons.at(-1)?.id ?? 0);
  return <Dialog open onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Test qo'shish</DialogTitle></DialogHeader>
      <div className="space-y-1.5"><Label htmlFor="qd-lesson">Qaysi darsga</Label>
        <select id="qd-lesson" className={`${select} w-full`} value={id ?? 0} onChange={(e) => setId(Number(e.target.value))}>
          {lessons.map((l) => <option key={l.id!} value={l.id!}>{l.title}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">Dars sahifasi ochiladi — "Test va Savol / Javob" bo'limida savollarni kiriting yoki .docx'dan yuklang.</p></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Yopish</Button>
        <Button disabled={!id} onClick={() => { const lesson = lessons.find((l) => l.id === id); if (lesson) onSubmit(lesson); }}>Davom etish</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function ConfirmDialog({ title, text, busy, onClose, onConfirm }: { title: string; text: string; busy: boolean; onClose: () => void; onConfirm: () => Promise<unknown> }) {
  return <Dialog open onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">{text}</p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
        <Button variant="destructive" disabled={busy} onClick={() => void onConfirm().catch(() => undefined)}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}O'chirish</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
