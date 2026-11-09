import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ChevronRight, FileText, Image as ImageIcon, Loader2, Settings2, Trash2, Upload, Video } from "lucide-react";
import { SyllabusCurriculum } from "@/components/admin/syllabus-curriculum";
import { LazyRichTextEditor } from "@/components/editor/lazy-rich-text-editor";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { SyllabusCover } from "@/components/learning/syllabus-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LessonContentPage, type OpenLesson } from "@/components/admin/syllabus-lesson-page";
import { syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { syllabusLanguages, type PlanPart } from "@/lib/syllabus";
import {
  syllabusApi, type SubjectSyllabus, type SyllabusLanguage, type SyllabusMediaKind,
} from "@/services/api/syllabus-api";

const select = "h-10 rounded-md border bg-background px-3 text-sm";

type Section = "program" | "basic" | "info" | "media";
const SECTIONS: { value: Section; label: string; icon: typeof BookOpen }[] = [
  { value: "program", label: "O'quv dasturi", icon: BookOpen },
  { value: "basic", label: "Asosiy", icon: Settings2 },
  { value: "info", label: "Ma'lumot", icon: FileText },
  { value: "media", label: "Media", icon: ImageIcon },
];

/**
 * O'quv dasturi (Everest kabi): "Ma'lumot" — nomi, tili, ta'riflar; "Dasturlar" — modullar, ularning darslari
 * (har darsga mashg'ulot turi) va dars kontenti (matn, video, hujjat, havola — kurs darsiga ko'chadi).
 * Rejadan ochilganda darslar rejadagi soatlar bilan solishtiriladi.
 * Faqat qoralama tahrirlanadi; tasdiqlangan dastur ko'rish rejimida ochiladi.
 * Ro'yxat o'rnida to'liq sahifa bo'lib ochiladi; dars kontenti ham shu sahifa ichida (yo'l: dastur › modul › dars).
 */
export function SyllabusPage({ item, canWrite, plan, initialTab = "info", onClose, onSaved }: {
  /** null — yangi dastur (avval "Ma'lumot" saqlanadi, keyin "Dasturlar" ochiladi) */
  item: SubjectSyllabus | null;
  canWrite: boolean;
  plan?: PlanPart[];
  initialTab?: "info" | "program";
  onClose: () => void;
  onSaved: (saved: SubjectSyllabus) => unknown;
}) {
  const [current, setCurrent] = useState<SubjectSyllabus | null>(item);
  const [tab, setTab] = useState<Section>(item && initialTab === "program" ? "program" : "basic");
  const editable = canWrite && (current == null || current.status === "DRAFT");
  const saved = async (value: SubjectSyllabus) => { setCurrent(value); await onSaved(value); };
  const title = current ? current.name : "O'quv dasturi qo'shish";
  // Ochilgan dars kontenti; dastur muharriri yashiriladi, lekin saqlanmagan o'zgarishlari yo'qolmaydi
  const [lesson, setLesson] = useState<OpenLesson | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const top = useRef<HTMLElement>(null);
  useEffect(() => { top.current?.scrollIntoView?.({ block: "start" }); }, [lesson]);

  return <section ref={top} aria-label={title} className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 border-b pb-3">
      <Button variant="outline" size="sm" onClick={lesson ? () => setLesson(null) : onClose}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />{lesson ? "Dasturga qaytish" : "Orqaga"}
      </Button>
      <nav aria-label="Sahifa yo'li" className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button type="button" className="hover:text-foreground hover:underline" onClick={onClose}>O'quv dasturlari</button>
        <ChevronRight className="h-3.5 w-3.5" />
        {lesson ? <button type="button" className="hover:text-foreground hover:underline" onClick={() => setLesson(null)}>{title}</button>
          : <span className="font-medium text-foreground">{title}</span>}
        {lesson && <>
          <ChevronRight className="h-3.5 w-3.5" /><span>{lesson.moduleName}</span>
          <ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-foreground">{lesson.title}</span>
        </>}
      </nav>
    </div>
    {lesson && current && <LessonContentPage key={lesson.id} syllabusId={current.id} lesson={lesson} editable={editable}
      onChanged={(count) => setCounts((value) => ({ ...value, [lesson.id]: count }))} />}
    <div hidden={lesson != null} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {current ? `${current.subjectName ?? "Fanga biriktirilmagan"} · ${syllabusStatuses[current.status]}` : "Avval ma'lumotlarni saqlang, keyin bo'limlar va darslarni kiriting."}
          {current && !editable && " — tahrirlash uchun dasturning yangi versiyasini oching."}
        </p>
      </div>
      {/* Mentor LMS kabi: chapda bo'limlar menyusi, o'ngda tanlangan bo'lim */}
      <Tabs value={tab} onValueChange={(value) => setTab(value as Section)} orientation="vertical"
        className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <TabsList aria-label="Dastur bo'limlari" className="flex h-auto flex-row flex-wrap items-stretch justify-start gap-1 rounded-xl border bg-background p-2 shadow-sm lg:flex-col">
          {SECTIONS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} disabled={value === "program" && !current}
              className="justify-start gap-2 rounded-md border-l-2 border-transparent px-3 py-2.5 data-[state=active]:border-foreground data-[state=active]:bg-muted data-[state=active]:shadow-none">
              <Icon className="h-4 w-4" />{label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-w-0 rounded-xl border bg-background p-4 shadow-sm sm:p-5">
          <TabsContent value="program" className="mt-0">
            {current && <SyllabusCurriculum key={current.id} item={current} editable={editable} plan={plan} onSaved={saved}
              counts={counts} onCount={(id, count) => setCounts((value) => ({ ...value, [id]: count }))} onOpenLesson={setLesson} />}
          </TabsContent>
          {tab !== "program" && <InfoForm key={current?.id ?? "new"} item={current} editable={editable} section={tab} onMedia={saved}
            onSaved={async (value) => { await saved(value); if (!item) setTab("program"); }} />}
        </div>
      </Tabs>
    </div>
  </section>;
}

/**
 * Dastur ma'lumoti (Everest "O'quv dasturi qo'shish" kabi): chapda fan, nomi, tili, qisqa ta'rif, talablar, natijalar;
 * o'ngda to'liq ta'rif (CKEditor + formula), muqova rasmi va tanishtiruv videosi. Hammasi talaba fan sahifasida ko'rinadi.
 * Yangi dasturda tanlangan rasm/video saqlangandan keyin yuklanadi.
 */
function InfoForm({ item, editable, section, onSaved, onMedia }: {
  item: SubjectSyllabus | null;
  editable: boolean;
  /** Ko'rinadigan qism; qolganlari yashirin, lekin holati saqlanadi va birga saqlanadi */
  section: Exclude<Section, "program">;
  onSaved: (value: SubjectSyllabus) => unknown;
  /** Rasm/video yuklandi yoki o'chirildi (tab almashmaydi) */
  onMedia: (value: SubjectSyllabus) => unknown;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [language, setLanguage] = useState<SyllabusLanguage>(item?.language ?? "UZ");
  const [shortDescription, setShortDescription] = useState(item?.shortDescription ?? "");
  const [requirements, setRequirements] = useState(item?.requirements ?? "");
  const [learningOutcomes, setLearningOutcomes] = useState(item?.learningOutcomes ?? "");
  const [fullDescription, setFullDescription] = useState(item?.fullDescription ?? "");
  const [introVideoUrl, setIntroVideoUrl] = useState(item?.introVideoUrl ?? "");
  const [pending, setPending] = useState<{ cover?: File; video?: File }>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const plainFull = fullDescription.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  // Fan tanlanmaydi — u o'quv reja taxtasida dastur biriktirilganda yoziladi; shuning uchun nom majburiy
  const invalid = name.trim().length < 3 ? "Dastur nomini kiriting (kamida 3 belgi)" : shortDescription.trim().length < 3 ? "Qisqa ta'rif kamida 3 belgi"
    : plainFull.length < 3 && !/<img|math-tex/.test(fullDescription) ? "To'liq ta'rif majburiy"
    : introVideoUrl.trim() && !/^https?:\/\/\S+$/i.test(introVideoUrl.trim()) ? "Video havolasi http(s):// bilan boshlanishi kerak" : null;
  const save = useMutation({
    mutationFn: async () => {
      const input = {
        subjectId: item?.subjectId ?? null, name: name.trim(), language, shortDescription: shortDescription.trim(),
        requirements: requirements.trim() || null, learningOutcomes: learningOutcomes.trim() || null, fullDescription: fullDescription.trim(),
        introVideoUrl: introVideoUrl.trim() || null, active: item?.active ?? true,
      };
      let value = item ? await syllabusApi.update(item.id, input) : await syllabusApi.create(input);
      if (pending.cover) value = await syllabusApi.uploadMedia(value.id, "cover", pending.cover);
      if (pending.video) value = await syllabusApi.uploadMedia(value.id, "video", pending.video);
      return value;
    },
    onSuccess: async (value) => { setError(null); setPending({}); await onSaved(value); toast({ title: "Ma'lumotlar saqlandi" }); },
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });
  // Mavjud dasturda rasm/video darhol yuklanadi; yangi dasturda — saqlashda
  const media = useMutation({
    mutationFn: ({ kind, file }: { kind: SyllabusMediaKind; file: File | null }) =>
      file ? syllabusApi.uploadMedia(item!.id, kind, file) : syllabusApi.removeMedia(item!.id, kind),
    onSuccess: async (value, { kind, file }) => {
      await queryClient.invalidateQueries({ queryKey: ["syllabus", value.id, "media", kind] });
      await onMedia(value);
      toast({ title: file ? (kind === "cover" ? "Rasm yuklandi" : "Video yuklandi") : "O'chirildi" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Fayl saqlanmadi", description: extractApiError(e, "Saqlanmadi").message }),
  });
  const pick = (kind: SyllabusMediaKind, file: File | null) => {
    if (item) media.mutate({ kind, file });
    else setPending((value) => ({ ...value, [kind]: file ?? undefined }));
  };

  return <div className="space-y-4">
    <div hidden={section !== "basic"} className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="sd-name">Nomi *</Label>
          <Input id="sd-name" value={name} maxLength={500} disabled={!editable} placeholder="O'quv dasturining nomini kiriting" onChange={(e) => setName(e.target.value)} />
          <p className="text-xs text-muted-foreground">{item?.subjectName
            ? <>Fan: <span className="font-medium text-foreground">{item.subjectName}</span> (o'quv rejada biriktirilgan)</>
            : "Fan o'quv reja taxtasida — fan kartasidagi 📖 orqali dastur biriktirilganda yoziladi."}</p></div>
        <div className="space-y-1.5"><Label htmlFor="sd-language">Dastur tili *</Label>
          <select id="sd-language" className={`${select} w-full`} value={language} disabled={!editable} onChange={(e) => setLanguage(e.target.value as SyllabusLanguage)}>
            {syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select></div>
        <div className="space-y-1.5"><Label htmlFor="sd-short">Qisqa ta'rif *</Label>
          <Textarea id="sd-short" rows={5} maxLength={2000} value={shortDescription} disabled={!editable} placeholder="Qisqacha ta'rifni kiriting" onChange={(e) => setShortDescription(e.target.value)} /></div>
      </div>
      <div className="min-w-0 space-y-1.5"><Label>To'liq ta'rif *</Label>
        {editable ? <LazyRichTextEditor value={fullDescription} onChange={setFullDescription} placeholder="Fan haqida to'liq ma'lumot..." />
          : <RichTextContent value={fullDescription} className="min-h-24 rounded-md border p-3 text-sm" />}</div>
    </div>
    <div hidden={section !== "info"} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="sd-req">Talablar</Label>
        <Textarea id="sd-req" rows={8} value={requirements} disabled={!editable} placeholder="Talablarni kiriting — har biri yangi qatordan" onChange={(e) => setRequirements(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="sd-outcomes">Natijalar</Label>
        <Textarea id="sd-outcomes" rows={8} value={learningOutcomes} disabled={!editable}
          placeholder={"Fanni o'rganib talaba nimalarga erishadi — har biri yangi qatordan"} onChange={(e) => setLearningOutcomes(e.target.value)} /></div>
      <p className="text-xs text-muted-foreground lg:col-span-2">Talaba fan sahifasida "Talablar va natijalar" bo'limida ro'yxat bo'lib ko'rinadi.</p>
    </div>
    <div hidden={section !== "media"} className="max-w-3xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <MediaTile kind="cover" label="Muqova rasmi" hint="512×512, JPG/PNG/WEBP" accept="image/jpeg,image/png,image/webp" editable={editable}
          busy={media.isPending && media.variables?.kind === "cover"} pending={pending.cover} item={item} onPick={(file) => pick("cover", file)} />
        <MediaTile kind="video" label="Tanishtiruv videosi" hint="MP4/WEBM, 200 MB gacha" accept="video/mp4,video/webm" editable={editable}
          busy={media.isPending && media.variables?.kind === "video"} pending={pending.video} item={item} onPick={(file) => pick("video", file)} />
      </div>
      <div className="space-y-1.5"><Label htmlFor="sd-video-url">Yoki video havolasi</Label>
        <Input id="sd-video-url" value={introVideoUrl} maxLength={1000} disabled={!editable} placeholder="https://youtube.com/..." onChange={(e) => setIntroVideoUrl(e.target.value)} />
        <p className="text-xs text-muted-foreground">Rasm bannerda, video "Fan haqida" bo'limida talabaga ko'rinadi. Havola "Saqlash" bilan saqlanadi.</p></div>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {editable && <div className="flex items-center justify-end gap-3 border-t pt-4">
      {invalid && <span className="text-xs text-muted-foreground">{invalid}</span>}
      <Button disabled={!!invalid || save.isPending} title={invalid ?? undefined} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{item ? "Saqlash" : "Saqlash va davom etish"}
      </Button>
    </div>}
  </div>;
}

/** Rasm/video yuklash plitkasi: ko'rinish (rasm), fayl nomi (video), almashtirish va o'chirish */
function MediaTile({ kind, label, hint, accept, editable, busy, pending, item, onPick }: {
  kind: SyllabusMediaKind; label: string; hint: string; accept: string; editable: boolean; busy: boolean;
  pending?: File; item: SubjectSyllabus | null; onPick: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const uploaded = kind === "cover" ? !!item?.coverImageAvailable : !!item?.introVideoName;
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!pending || kind !== "cover") { setPreview(null); return; }
    const url = URL.createObjectURL(pending);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pending, kind]);
  const Icon = kind === "cover" ? ImageIcon : Video;
  const name = pending?.name ?? (kind === "video" ? item?.introVideoName : null);
  return <div className="space-y-1.5">
    <Label>{label}</Label>
    <div className="relative flex h-40 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed text-center">
      {kind === "cover" && (preview ? <img src={preview} alt={label} className="absolute inset-0 h-full w-full object-cover" />
        : item && uploaded ? <SyllabusCover queryKey={["syllabus", item.id, "media", "cover", item.updatedAt]} load={() => syllabusApi.mediaFile(item.id, "cover")}
          available alt={label} className="absolute inset-0 h-full w-full" /> : null)}
      {!(kind === "cover" && (preview || uploaded)) && <>
        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
        <span className="max-w-full truncate px-3 text-sm">{name ?? (editable ? (kind === "cover" ? "Rasm yuklang" : "Videoni yuklang") : "Yuklanmagan")}</span>
        <span className="text-xs text-muted-foreground">{name ? (pending ? "saqlashda yuklanadi" : "yuklangan") : hint}</span>
      </>}
      {busy && <div className="absolute inset-0 flex items-center justify-center bg-background/70"><Loader2 className="h-5 w-5 animate-spin" /></div>}
    </div>
    {editable && <div className="flex gap-2">
      <input ref={input} type="file" accept={accept} hidden aria-label={`${label} fayli`}
        onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) onPick(file); }} />
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
        <Upload className="mr-1.5 h-3.5 w-3.5" />{uploaded || pending ? "Almashtirish" : "Yuklash"}</Button>
      {(uploaded || pending) && <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onPick(null)}>
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />O'chirish</Button>}
    </div>}
  </div>;
}
