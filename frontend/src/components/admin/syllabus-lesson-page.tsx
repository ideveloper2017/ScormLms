import { useState, type ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ExternalLink, File, FileText, Link as LinkIcon, Loader2, Pencil, Plus, Trash2, Video, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LazyRichTextEditor } from "@/components/editor/lazy-rich-text-editor";
import { isRichTextEmpty, richTextToPlainText } from "@/components/editor/rich-text-utils";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { topicTypeMeta } from "@/lib/syllabus";
import { LessonQuizzes } from "@/components/admin/syllabus-lesson-quizzes";
import {
  syllabusApi, type LessonMaterialInput, type LessonMaterialType, type LessonMaterialsResult, type LessonQuiz,
  type SyllabusLinkedCourse, type SyllabusTopicType,
} from "@/services/api/syllabus-api";
import type { SubjectMaterial } from "@/services/api/teacher-portal-api";

const select = "h-10 rounded-md border bg-background px-3 text-sm";

const MATERIAL_TYPES: { value: LessonMaterialType; label: string; icon: ElementType }[] = [
  { value: "TEXT", label: "Matn", icon: FileText },
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "DOCUMENT", label: "Hujjat (PDF)", icon: FileText },
  { value: "FILE", label: "Fayl", icon: File },
  { value: "LINK", label: "Havola", icon: LinkIcon },
];
const typeOf = (value: string) => MATERIAL_TYPES.find((t) => t.value === value.toUpperCase()) ?? MATERIAL_TYPES[3];

/**
 * Dars kontenti (Everest: Dasturlar -> modul -> dars -> resurslar): matn, video, hujjat, fayl yoki havola,
 * hamda Test va Savol/Javob (kursga test bo'lib tushadi).
 * Materiallar fan bankida saqlanadi; dasturdan yaratilgan kurslarning shu darsiga avtomatik ko'chadi
 * (qoralama kurslarga darhol, nashr qilinganiga — kursdagi "Dastur bilan sinxronlash" orqali).
 * Dastur sahifasi ichida to'liq sahifa bo'lib ochiladi (orqaga qaytish — dastur sahifasining yo'lida).
 */
export interface OpenLesson { id: number; title: string; type: SyllabusTopicType; moduleName: string }

export function LessonContentPage({ syllabusId, lesson, editable, onChanged }: {
  syllabusId: number;
  lesson: OpenLesson;
  editable: boolean;
  /** Material soni o'zgarganda (dastur ro'yxatidagi hisoblagich uchun) */
  onChanged: (count: number) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const key = ["syllabus", syllabusId, "lesson", lesson.id, "materials"];
  const materials = useQuery({ queryKey: key, queryFn: () => syllabusApi.lessonMaterials(syllabusId, lesson.id) });
  const [editing, setEditing] = useState<SubjectMaterial | "new" | null>(null);
  const list = materials.data ?? [];

  const quizKey = ["syllabus", syllabusId, "lesson", lesson.id, "quizzes"];
  const notify = (title: string, courses: SyllabusLinkedCourse[], field: "materials" | "quizzes") => {
    const synced = courses.filter((c) => (c[field] ?? 0) > 0);
    const published = courses.filter((c) => !c.autoSync);
    const description = [
      synced.length ? `Kursga ham tushdi: ${synced.map((c) => `«${c.title}»`).join(", ")}` : null,
      published.length ? `Nashr qilingan ${published.map((c) => `«${c.title}»`).join(", ")} kursiga dastur tasdiqlangach "Dastur bilan sinxronlash" orqali tushadi` : null,
    ].filter(Boolean).join(". ");
    toast({ title, description: description || undefined });
  };
  const applied = (result: LessonMaterialsResult, title: string) => {
    queryClient.setQueryData(key, result.materials);
    onChanged(result.materials.length + (queryClient.getQueryData<LessonQuiz[]>(quizKey)?.length ?? 0));
    notify(title, result.courses, "materials");
  };
  const failed = (title: string) => (e: unknown) => toast({ variant: "destructive", title, description: extractApiError(e, title).message });
  const remove = useMutation({
    mutationFn: (id: number) => syllabusApi.deleteLessonMaterial(syllabusId, lesson.id, id),
    onSuccess: (result) => applied(result, "Material o'chirildi"),
    onError: failed("Material o'chirilmadi"),
  });
  const reorder = useMutation({
    mutationFn: (ids: number[]) => syllabusApi.reorderLessonMaterials(syllabusId, lesson.id, ids),
    onSuccess: (result) => applied(result, "Tartib saqlandi"),
    onError: failed("Tartib saqlanmadi"),
  });
  const move = (index: number, to: number) => {
    const ids = list.map((m) => m.id);
    const [id] = ids.splice(index, 1);
    ids.splice(to, 0, id);
    reorder.mutate(ids);
  };

  return <div className="max-w-5xl space-y-6">
    <div>
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <p className="text-sm text-muted-foreground">{lesson.moduleName} · {topicTypeMeta[lesson.type].short} mashg'ulot · dars kontenti</p>
    </div>
    <section aria-label="Dars materiallari" className="space-y-3 rounded-lg border p-4 shadow-sm">
      <h2 className="text-base font-semibold">Materiallar</h2>
      {materials.isLoading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>}
      {!materials.isLoading && list.length === 0 && editing == null &&
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Darsda hali kontent yo'q. Matn, video, hujjat yoki havola qo'shing.</p>}
      <ol className="space-y-2">
        {list.map((material, index) => {
          const meta = typeOf(material.contentType);
          const Icon = meta.icon;
          return editing !== "new" && editing?.id === material.id
            ? <li key={material.id}><MaterialForm syllabusId={syllabusId} lessonId={lesson.id} material={material}
                onCancel={() => setEditing(null)} onSaved={(result) => { setEditing(null); applied(result, "Material saqlandi"); }} /></li>
            : <li key={material.id} aria-label={`${index + 1}-material`} className="flex items-start gap-3 rounded-lg border p-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{index + 1}. {material.title}</p>
                {material.description && <p className="line-clamp-2 text-xs text-muted-foreground">{richTextToPlainText(material.description)}</p>}
                {material.asset && <p className="truncate text-xs text-muted-foreground">{material.asset.originalFileName}</p>}
                {material.contentBody && <p className="mt-1 line-clamp-2 text-sm">{richTextToPlainText(material.contentBody)}</p>}
              </div>
              <Badge variant="outline">{meta.label}</Badge>
              {material.contentUrl && <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={material.contentUrl} target="_blank" rel="noreferrer" aria-label="Havolani ochish"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
              {editable && <>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Materialni yuqoriga" disabled={index === 0 || reorder.isPending} onClick={() => move(index, index - 1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Materialni pastga" disabled={index === list.length - 1 || reorder.isPending} onClick={() => move(index, index + 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${material.title} — tahrirlash`} onClick={() => setEditing(material)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`${material.title} — o'chirish`} disabled={remove.isPending} onClick={() => remove.mutate(material.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </>}
            </li>;
        })}
      </ol>
      {editing === "new" && <MaterialForm syllabusId={syllabusId} lessonId={lesson.id}
        onCancel={() => setEditing(null)} onSaved={(result) => { setEditing(null); applied(result, "Material qo'shildi"); }} />}
      {editable && editing == null && <Button variant="outline" onClick={() => setEditing("new")}><Plus className="mr-2 h-4 w-4" />Kontent qo'shish</Button>}
    </section>
    <section aria-label="Test va Savol / Javob" className="space-y-2 rounded-lg border p-4 shadow-sm">
      <h2 className="text-base font-semibold">Test va Savol / Javob</h2>
      <p className="text-xs text-muted-foreground">Kursning shu darsiga test bo'lib tushadi (qoralama) — o'qituvchi muddatini tekshirib nashr qiladi.</p>
      <LessonQuizzes syllabusId={syllabusId} lessonId={lesson.id} editable={editable} onChanged={(count, title, courses) => {
        onChanged(count + (queryClient.getQueryData<SubjectMaterial[]>(key)?.length ?? 0));
        notify(title, courses, "quizzes");
      }} />
    </section>
    {!editable && <p className="text-xs text-muted-foreground">Kontent faqat qoralama dasturda tahrirlanadi — dasturning yangi versiyasini oching.</p>}
  </div>;
}

function MaterialForm({ syllabusId, lessonId, material, onCancel, onSaved }: {
  syllabusId: number;
  lessonId: number;
  material?: SubjectMaterial;
  onCancel: () => void;
  onSaved: (result: LessonMaterialsResult) => void;
}) {
  const [type, setType] = useState<LessonMaterialType>(material ? typeOf(material.contentType).value : "TEXT");
  const [title, setTitle] = useState(material?.title ?? "");
  const [description, setDescription] = useState(material?.description ?? "");
  const [body, setBody] = useState(material?.contentBody ?? "");
  const [url, setUrl] = useState(material?.contentUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  // Tahrirlashda mavjud fayl saqlanadi (yangisi tanlanmasa)
  const keptAssetId = material?.asset && !file && typeOf(material.contentType).value === type ? material.asset.id : undefined;
  const [error, setError] = useState<string | null>(null);
  const withFile = type === "VIDEO" || type === "DOCUMENT" || type === "FILE";
  const invalid = title.trim().length < 2 ? "Material nomi kamida 2 belgi"
    : type === "TEXT" && isRichTextEmpty(body) ? "Dars matnini kiriting"
      : type === "LINK" && !url.trim() ? "Havolani kiriting"
        : withFile && !file && !keptAssetId && !url.trim() ? "Fayl tanlang yoki URL kiriting" : null;
  const save = useMutation({
    mutationFn: async () => {
      const asset = withFile && file ? await syllabusApi.uploadLessonAsset(syllabusId, file) : undefined;
      const assetId = asset?.id ?? (withFile ? keptAssetId : undefined);
      const input: LessonMaterialInput = {
        title: title.trim(), description: description.trim() || null, contentType: type,
        contentBody: type === "TEXT" ? body : null,
        contentUrl: type === "TEXT" || assetId ? null : url.trim() || null,
        assetId: assetId ?? null,
      };
      return material
        ? syllabusApi.updateLessonMaterial(syllabusId, lessonId, material.id, input)
        : syllabusApi.createLessonMaterial(syllabusId, lessonId, input);
    },
    onSuccess: onSaved,
    onError: (e) => setError(extractApiError(e, "Material saqlanmadi").message),
  });

  return <div className="space-y-3 rounded-lg border bg-muted/30 p-3" aria-label={material ? "Materialni tahrirlash" : "Yangi kontent"}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold">{material ? "Materialni tahrirlash" : "Yangi kontent"}</p>
      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Bekor qilish" onClick={onCancel}><X className="h-4 w-4" /></Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
      <div className="space-y-1.5"><Label htmlFor="lm-type">Turi *</Label>
        <select id="lm-type" className={`${select} w-full`} value={type} onChange={(e) => { setType(e.target.value as LessonMaterialType); setFile(null); }}>
          {MATERIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select></div>
      <div className="space-y-1.5"><Label htmlFor="lm-title">Nomi *</Label>
        <Input id="lm-title" value={title} maxLength={255} placeholder="Masalan: Ma'ruza matni" onChange={(e) => setTitle(e.target.value)} /></div>
    </div>
    {type === "TEXT" ? <div className="space-y-1.5"><Label>Dars matni *</Label>
      <LazyRichTextEditor value={body} onChange={setBody} placeholder="Dars mazmunini yozing..." /></div>
      : type === "LINK" ? <div className="space-y-1.5"><Label htmlFor="lm-url">Havola *</Label>
        <Input id="lm-url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} /></div>
        : <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="lm-file">Fayl</Label>
            <Input id="lm-file" type="file" accept={type === "VIDEO" ? "video/mp4,video/webm" : type === "DOCUMENT" ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" : undefined}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {keptAssetId && <p className="text-xs text-muted-foreground">Joriy fayl: {material?.asset?.originalFileName}</p>}</div>
          <div className="space-y-1.5"><Label htmlFor="lm-url">Yoki tashqi URL</Label>
            <Input id="lm-url" placeholder="https://..." disabled={Boolean(file || keptAssetId)} value={url} onChange={(e) => setUrl(e.target.value)} /></div>
        </div>}
    <div className="space-y-1.5"><Label htmlFor="lm-description">Izoh</Label>
      <Textarea id="lm-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel}>Bekor qilish</Button>
      <Button disabled={!!invalid || save.isPending} title={invalid ?? undefined} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash
      </Button>
    </div>
  </div>;
}
