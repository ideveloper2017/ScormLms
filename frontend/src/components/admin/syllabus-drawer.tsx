import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PlanTopicsCheck } from "@/components/admin/syllabus-topics";
import { syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { useToast } from "@/hooks/use-toast";
import { extractApiError, listSubjects } from "@/lib/academic-api";
import { TOPIC_TYPES, planHours, syllabusLanguages, topicTypeMeta, type PlanPart } from "@/lib/syllabus";
import { modulesOf } from "@/lib/syllabus-modules";
import {
  syllabusApi, type SubjectSyllabus, type SyllabusLanguage, type SyllabusModuleInput, type SyllabusTopicType,
} from "@/services/api/syllabus-api";

const select = "h-10 rounded-md border bg-background px-3 text-sm";

/**
 * O'quv dasturi (Everest kabi): "Ma'lumot" — nomi, tili, ta'riflar; "Dasturlar" — modullar va ularning darslari
 * (har darsga mashg'ulot turi). Rejadan ochilganda darslar rejadagi soatlar bilan solishtiriladi.
 * Faqat qoralama tahrirlanadi; tasdiqlangan dastur ko'rish rejimida ochiladi.
 */
export function SyllabusDrawer({ item, canWrite, plan, initialTab = "info", onClose, onSaved }: {
  /** null — yangi dastur (avval "Ma'lumot" saqlanadi, keyin "Dasturlar" ochiladi) */
  item: SubjectSyllabus | null;
  canWrite: boolean;
  plan?: PlanPart[];
  initialTab?: "info" | "program";
  onClose: () => void;
  onSaved: (saved: SubjectSyllabus) => unknown;
}) {
  const [current, setCurrent] = useState<SubjectSyllabus | null>(item);
  const [tab, setTab] = useState<"info" | "program">(item ? initialTab : "info");
  const editable = canWrite && (current == null || current.status === "DRAFT");
  const saved = async (value: SubjectSyllabus) => { setCurrent(value); await onSaved(value); };

  return <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
    <SheetContent side="right" className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
      <SheetHeader>
        <SheetTitle>{current ? current.name : "O'quv dasturi qo'shish"}</SheetTitle>
        <SheetDescription>
          {current ? `${current.subjectName} · ${syllabusStatuses[current.status]}` : "Avval ma'lumotlarni saqlang, keyin modullar va darslarni kiriting."}
          {current && !editable && " — tahrirlash uchun dasturning yangi versiyasini oching."}
        </SheetDescription>
      </SheetHeader>
      <Tabs value={tab} onValueChange={(value) => setTab(value as "info" | "program")} className="px-4 pb-6">
        <TabsList>
          <TabsTrigger value="info">Ma'lumot</TabsTrigger>
          <TabsTrigger value="program" disabled={!current}>Dasturlar</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-4">
          <InfoForm key={current?.id ?? "new"} item={current} editable={editable}
            onSaved={async (value) => { await saved(value); if (!item) setTab("program"); }} />
        </TabsContent>
        <TabsContent value="program" className="mt-4">
          {current && <ProgramEditor key={current.id} item={current} editable={editable} plan={plan} onSaved={saved} />}
        </TabsContent>
      </Tabs>
    </SheetContent>
  </Sheet>;
}

function InfoForm({ item, editable, onSaved }: { item: SubjectSyllabus | null; editable: boolean; onSaved: (value: SubjectSyllabus) => unknown }) {
  const subjects = useQuery({ queryKey: ["subjects", "all"], queryFn: () => listSubjects(), enabled: item == null });
  const [subjectId, setSubjectId] = useState(item?.subjectId ?? 0);
  const [name, setName] = useState(item?.name ?? "");
  const [language, setLanguage] = useState<SyllabusLanguage>(item?.language ?? "UZ");
  const [shortDescription, setShortDescription] = useState(item?.shortDescription ?? "");
  const [requirements, setRequirements] = useState(item?.requirements ?? "");
  const [fullDescription, setFullDescription] = useState(item?.fullDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const invalid = !subjectId ? "Fanni tanlang" : shortDescription.trim().length < 3 ? "Qisqa ta'rif kamida 3 belgi"
    : fullDescription.trim().length < 3 ? "To'liq ta'rif majburiy" : null;
  const save = useMutation({
    mutationFn: () => {
      const input = {
        subjectId, name: name.trim() || undefined, language, shortDescription: shortDescription.trim(),
        requirements: requirements.trim() || null, fullDescription: fullDescription.trim(), active: item?.active ?? true,
      };
      return item ? syllabusApi.update(item.id, input) : syllabusApi.create(input);
    },
    onSuccess: async (value) => { setError(null); await onSaved(value); toast({ title: "Ma'lumotlar saqlandi" }); },
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });

  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      {item ? <div className="space-y-1.5"><Label>Fan</Label><p className="pt-2 text-sm">{item.subjectName}</p></div> :
        <div className="space-y-1.5"><Label htmlFor="sd-subject">Fan *</Label>
          <select id="sd-subject" className={`${select} w-full`} value={subjectId} disabled={!editable} onChange={(e) => setSubjectId(Number(e.target.value))}>
            <option value={0}>Fanni tanlang</option>
            {(subjects.data ?? []).filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>)}
          </select></div>}
      <div className="space-y-1.5"><Label htmlFor="sd-language">Dastur tili *</Label>
        <select id="sd-language" className={`${select} w-full`} value={language} disabled={!editable} onChange={(e) => setLanguage(e.target.value as SyllabusLanguage)}>
          {syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select></div>
    </div>
    <div className="space-y-1.5"><Label htmlFor="sd-name">Nomi</Label>
      <Input id="sd-name" value={name} maxLength={500} disabled={!editable} placeholder="Bo'sh qolsa fan nomi olinadi" onChange={(e) => setName(e.target.value)} /></div>
    <div className="space-y-1.5"><Label htmlFor="sd-short">Qisqa ta'rif *</Label>
      <Textarea id="sd-short" rows={2} maxLength={2000} value={shortDescription} disabled={!editable} onChange={(e) => setShortDescription(e.target.value)} /></div>
    <div className="space-y-1.5"><Label htmlFor="sd-req">Talablar</Label>
      <Textarea id="sd-req" rows={2} value={requirements} disabled={!editable} onChange={(e) => setRequirements(e.target.value)} /></div>
    <div className="space-y-1.5"><Label htmlFor="sd-full">To'liq ta'rif *</Label>
      <Textarea id="sd-full" rows={5} value={fullDescription} disabled={!editable} onChange={(e) => setFullDescription(e.target.value)} /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {editable && <div className="flex justify-end">
      <Button disabled={!!invalid || save.isPending} title={invalid ?? undefined} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{item ? "Saqlash" : "Saqlash va davom etish"}
      </Button>
    </div>}
  </div>;
}

function ProgramEditor({ item, editable, plan, onSaved }: { item: SubjectSyllabus; editable: boolean; plan?: PlanPart[]; onSaved: (value: SubjectSyllabus) => unknown }) {
  const { toast } = useToast();
  const [modules, setModules] = useState<SyllabusModuleInput[]>(() => modulesOf(item));
  const [error, setError] = useState<string | null>(null);
  const lessons = modules.flatMap((m) => m.lessons);
  const parts = Math.max(plan?.length ?? 0, ...lessons.map((l) => l.part ?? 1), 1);
  // Rejadan ochilganda: faqat rejada soati bor turlar (turlarga bo'linmagan rejada — barchasi)
  const types: SyllabusTopicType[] = plan?.length && TOPIC_TYPES.some((type) => planHours(plan, type) !== null)
    ? TOPIC_TYPES.filter((type) => (planHours(plan, type) ?? 0) > 0 || lessons.some((l) => l.type === type))
    : TOPIC_TYPES;
  const update = (index: number, change: Partial<SyllabusModuleInput>) =>
    setModules((list) => list.map((m, i) => (i === index ? { ...m, ...change } : m)));
  const move = <T,>(list: T[], from: number, to: number) => {
    if (to < 0 || to >= list.length) return list;
    const copy = [...list]; const [value] = copy.splice(from, 1); copy.splice(to, 0, value); return copy;
  };
  const invalid = modules.some((m) => m.name.trim().length < 3) ? "Modul nomi kamida 3 belgi bo'lishi kerak"
    : lessons.some((l) => l.title.trim().length < 2) ? "Dars nomi kiritilmagan" : null;
  const save = useMutation({
    mutationFn: () => syllabusApi.updateModulesWithCourses(item.id, modules.map((m) => ({
      id: m.id ?? null, name: m.name.trim(), description: m.description?.trim() || null,
      lessons: m.lessons.map((l) => ({ id: l.id ?? null, type: l.type, title: l.title.trim(), description: l.description?.trim() || null, part: parts > 1 ? l.part ?? 1 : null })),
    }))),
    onSuccess: async (result) => {
      setError(null);
      setModules(modulesOf(result.syllabus));
      await onSaved(result.syllabus);
      const changed = result.courses.filter((c) => c.added + c.updated > 0);
      toast({
        title: "Dastur saqlandi",
        description: changed.length ? changed.map((c) => `«${c.title}»: ${c.added} ta bo'lim qo'shildi, ${c.updated} ta yangilandi`).join("; ") : undefined,
      });
    },
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });

  return <div className="space-y-4">
    {plan?.length ? <PlanTopicsCheck topics={lessons} plan={plan} noun="dars" /> : null}
    {modules.map((module, index) => (
      <section key={module.id ?? `new-${index}`} aria-label={`${index + 1}-modul`} className="space-y-3 rounded-lg border p-3 shadow-sm">
        <div className="flex items-start gap-2">
          <span className="mt-2 text-sm font-semibold text-muted-foreground">{index + 1}.</span>
          <div className="flex-1 space-y-2">
            <Input aria-label={`${index + 1}-modul nomi`} placeholder="Modul nomi" value={module.name} maxLength={255} disabled={!editable}
              onChange={(e) => update(index, { name: e.target.value })} />
            <Textarea aria-label={`${index + 1}-modul ma'lumoti`} placeholder="Modul haqida qisqa ma'lumot" rows={2} maxLength={500} value={module.description ?? ""} disabled={!editable}
              onChange={(e) => update(index, { description: e.target.value })} />
          </div>
          {editable && <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${index + 1}-modulni yuqoriga`} disabled={index === 0} onClick={() => setModules((l) => move(l, index, index - 1))}><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${index + 1}-modulni pastga`} disabled={index === modules.length - 1} onClick={() => setModules((l) => move(l, index, index + 1))}><ArrowDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`${index + 1}-modulni o'chirish`} onClick={() => setModules((l) => l.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
          </div>}
        </div>
        <ol className="space-y-2 pl-6">
          {module.lessons.map((lesson, lessonIndex) => (
            <li key={lesson.id ?? `l-${lessonIndex}`} className="flex flex-wrap items-center gap-2">
              <span className="w-6 text-xs text-muted-foreground">{lessonIndex + 1}.</span>
              <Input className="min-w-48 flex-1" aria-label={`${index + 1}-modul ${lessonIndex + 1}-dars nomi`} placeholder="Dars nomi" value={lesson.title} maxLength={500} disabled={!editable}
                onChange={(e) => update(index, { lessons: module.lessons.map((l, i) => (i === lessonIndex ? { ...l, title: e.target.value } : l)) })} />
              <select aria-label={`${index + 1}-modul ${lessonIndex + 1}-dars turi`} className={`${select} w-36`} value={lesson.type} disabled={!editable}
                onChange={(e) => update(index, { lessons: module.lessons.map((l, i) => (i === lessonIndex ? { ...l, type: e.target.value as SyllabusTopicType } : l)) })}>
                {types.map((type) => <option key={type} value={type}>{topicTypeMeta[type].short}</option>)}
              </select>
              {parts > 1 && <select aria-label={`${index + 1}-modul ${lessonIndex + 1}-dars qismi`} className={`${select} w-28`} value={lesson.part ?? 1} disabled={!editable}
                onChange={(e) => update(index, { lessons: module.lessons.map((l, i) => (i === lessonIndex ? { ...l, part: Number(e.target.value) } : l)) })}>
                {Array.from({ length: parts }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}-qism</option>)}
              </select>}
              {editable && <>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Darsni yuqoriga" disabled={lessonIndex === 0}
                  onClick={() => update(index, { lessons: move(module.lessons, lessonIndex, lessonIndex - 1) })}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Darsni pastga" disabled={lessonIndex === module.lessons.length - 1}
                  onClick={() => update(index, { lessons: move(module.lessons, lessonIndex, lessonIndex + 1) })}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`${index + 1}-modul ${lessonIndex + 1}-darsni o'chirish`}
                  onClick={() => update(index, { lessons: module.lessons.filter((_, i) => i !== lessonIndex) })}><Trash2 className="h-3.5 w-3.5" /></Button>
              </>}
            </li>
          ))}
          {module.lessons.length === 0 && <li className="text-xs text-muted-foreground">Darslar yo'q</li>}
        </ol>
        {editable && <Button variant="outline" size="sm" className="ml-6"
          onClick={() => update(index, { lessons: [...module.lessons, { type: module.lessons.at(-1)?.type ?? types[0], title: "", part: module.lessons.at(-1)?.part ?? null }] })}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />Dars qo'shish
        </Button>}
      </section>
    ))}
    {modules.length === 0 && <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Hali modul yo'q. Dastur modullardan, modullar darslardan iborat.</p>}
    {editable && <Button variant="outline" onClick={() => setModules((l) => [...l, { name: `${l.length + 1}-modul`, description: "", lessons: [] }])}>
      <Plus className="mr-2 h-4 w-4" />Yangi modul
    </Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {editable && <div className="flex justify-end">
      <Button disabled={!!invalid || save.isPending} title={invalid ?? undefined} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Dasturni saqlash
      </Button>
    </div>}
  </div>;
}
