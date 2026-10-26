import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ListPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { extractApiError } from "@/lib/academic-api";
import { TOPIC_TYPES as TYPES, creditWorkload, formatTypeHours, planHours, topicTypeMeta, validateTopics, type PlanPart } from "@/lib/syllabus";
import { TopicTypeBadge } from "@/components/topic-type-badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  syllabusApi, syllabusTopicTypes,
  type SubjectSyllabus, type SyllabusTopic, type SyllabusTopicInput, type SyllabusTopicType,
} from "@/services/api/syllabus-api";



/**
 * O'quv dasturi mavzularini alohida boshqarish (dastur yaratilgandan keyin).
 * Faqat qoralama dasturda tahrirlanadi; aks holda ko'rish rejimida ochiladi.
 */
export function SyllabusTopicsDialog({ item, canWrite, credits, plan, title, onClose, onSaved }: {
  item: SubjectSyllabus;
  canWrite: boolean;
  /** Oyna sarlavhasi (berilmasa "Mavzular — dastur nomi") */
  title?: string;
  /** Fan krediti — yuklama hisobi uchun */
  credits?: number | null;
  /** O'quv rejadan ochilganda: fanning semestrlar (qismlar) bo'yicha reja soatlari */
  plan?: PlanPart[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const editable = canWrite && item.status === "DRAFT";
  const [topics, setTopics] = useState<SyllabusTopicInput[]>(
    (item.topics ?? []).map((t) => ({ id: t.id, type: t.type, title: t.title, description: t.description ?? "", hours: t.hours, part: t.part ?? null })),
  );
  const parts = Math.max(plan?.length ?? 0, ...topics.map((t) => t.part ?? 1), 1);
  // Rejadan ochilganda ixcham: faqat rejada soati bor turlar, nom + soat, bitta qatorli solishtirish
  const compact = Boolean(plan?.length);
  const planTypes = plan?.length && TYPES.some((type) => planHours(plan, type) !== null)
    ? TYPES.filter((type) => (planHours(plan, type) ?? 0) > 0 || topics.some((t) => t.type === type))
    : undefined;
  const [error, setError] = useState<string | null>(null);
  const courses = useQuery({
    queryKey: ["syllabus-courses", item.id],
    queryFn: () => syllabusApi.linkedCourses(item.id),
  });
  const save = useMutation({
    mutationFn: () => syllabusApi.updateTopicsWithCourses(item.id, topics.map((t) => ({
      id: t.id ?? null, type: t.type, title: t.title.trim(), description: t.description?.trim() || null, hours: Number(t.hours),
      part: parts > 1 ? t.part ?? 1 : null,
    }))),
    onSuccess: (result) => {
      const changed = result.courses.filter((c) => c.added + c.updated > 0);
      toast({
        title: "Mavzular saqlandi",
        description: changed.length
          ? changed.map((c) => `«${c.title}»: ${c.added} ta bo'lim qo'shildi, ${c.updated} ta yangilandi`).join("; ")
          : undefined,
      });
      onSaved();
      onClose();
    },
    onError: (e) => setError(extractApiError(e, "Mavzular saqlanmadi").message),
  });
  const submit = () => {
    const problem = validateTopics(topics);
    setError(problem);
    if (!problem) save.mutate();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title ?? `Mavzular — ${item.name}`}</DialogTitle>
          <DialogDescription>
            {!editable
              ? "Dastur tasdiqlangan — mavzularni o'zgartirish uchun \"O'quv dasturi\" bo'limida yangi versiya oching."
              : compact
                ? "Mavzu nomi va soatini kiriting. Soatlar o'quv rejadagiga teng bo'lishi kerak."
                : "Nazariy, amaliy, laboratoriya va seminar mashg'ulotlari mavzulari hamda soatlarini kiriting. Mavzular mazmuni (darslar, materiallar) kurs modulida to'ldiriladi."}
          </DialogDescription>
        </DialogHeader>
        {plan?.length ? <PlanHoursCheck topics={editable ? topics : item.topics ?? []} plan={plan} compact /> : null}
        {editable
          ? <SyllabusTopicsEditor value={topics} parts={parts} compact={compact} types={planTypes}
              onChange={(value) => { setTopics(value); setError(null); }} />
          : <SyllabusTopicsView topics={item.topics} />}
        {!compact && <CreditWorkload credits={credits} topics={editable ? topics : item.topics ?? []} />}
        {!compact && (courses.data?.length ?? 0) > 0 && (
          <div className="space-y-1 rounded-md border p-2 text-xs">
            <p className="font-medium">Bu dastur asosidagi kurslar</p>
            <ul className="space-y-0.5">
              {courses.data!.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2">
                  <span>«{c.title}»</span>
                  {c.autoSync
                    ? <Badge variant="secondary">qoralama — bo'limlari avtomatik yangilanadi</Badge>
                    : <Badge variant="outline">nashr qilingan — dastur tasdiqlangach kurs sahifasida sinxronlanadi</Badge>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>{editable ? "Bekor qilish" : "Yopish"}</Button>
          {editable && (
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Mavzularni saqlash
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const sumHours = (topics: Pick<SyllabusTopicInput, "hours">[]) => topics.reduce((total, t) => total + (Number(t.hours) || 0), 0);

/** Kredit-modul tizimidagi yuklama: auditoriya (barcha mashg'ulot turlari) va mustaqil ta'lim soatlari. */
export function CreditWorkload({ credits, topics }: { credits?: number | null; topics: Pick<SyllabusTopicInput, "hours">[] }) {
  const auditory = sumHours(topics);
  if (!credits) {
    return <p className="text-xs text-muted-foreground">Auditoriya soatlari: {auditory}. Fan krediti ko'rsatilmagan — mustaqil ta'lim hisoblanmadi.</p>;
  }
  const load = creditWorkload(credits, auditory);
  return (
    <p role={load.exceeded ? "alert" : "status"} className={cn("rounded-md border p-2 text-xs",
      load.exceeded ? "border-destructive text-destructive" : "bg-muted/40")}>
      Fan krediti: {credits} → umumiy yuklama {load.total} soat. Auditoriya (barcha mashg'ulotlar): {load.auditory} soat ·
      mustaqil ta'lim: {Math.max(load.selfStudy, 0)} soat
      {load.exceeded && " — auditoriya soatlari kredit hajmidan oshib ketdi"}
    </p>
  );
}

/**
 * O'quv reja bilan solishtirish: dastur mavzulari soatlari reja soatlariga (tur bo'yicha, ko'p semestrli fanda
 * qismlar bo'yicha ham) teng bo'lishi kerak. Masofaviy shaklda auditoriya jami solishtiriladi.
 */
export function PlanHoursCheck({ topics, plan, compact = false }: {
  topics: Pick<SyllabusTopicInput, "type" | "hours" | "part">[];
  plan: PlanPart[];
  /** Bitta qatorli belgilar: "Ma'ruza 20/30 · Amaliy 45/45 ✓" */
  compact?: boolean;
}) {
  const row = (label: string, done: number, limit: number) => compact ? (
    <li key={label} className={cn("rounded-full border px-2 py-0.5 tabular-nums", done === limit
      ? "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
      : "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400")}>
      <span>{label}</span> <span>{done}/{limit}{done === limit ? " ✓" : ""}</span>
    </li>
  ) : (
    <li key={label} className={cn("flex items-center justify-between gap-2", done === limit ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400")}>
      <span>{label}</span>
      <span className="tabular-nums">taqsimlandi {done} / reja {limit}{done === limit ? " ✓" : ""}</span>
    </li>
  );
  const lines = (parts: PlanPart[], filter: (t: Pick<SyllabusTopicInput, "part">) => boolean, prefix = "") => {
    const scoped = topics.filter(filter);
    const typed = TYPES.map((type) => ({ type, limit: planHours(parts, type) }));
    if (typed.every((t) => t.limit === null)) {
      return [row(`${prefix}${compact ? "Auditoriya" : "Auditoriya (turlarga bo'linmagan)"}`, sumHours(scoped), parts.reduce((s, p) => s + p.auditory, 0))];
    }
    return typed.filter((t) => (t.limit ?? 0) > 0 || scoped.some((x) => x.type === t.type))
      .map((t) => row(`${prefix}${topicTypeMeta[t.type].short}`, sumHours(scoped.filter((x) => x.type === t.type)), t.limit ?? 0));
  };
  if (compact) {
    return (
      <div className="space-y-1 text-xs" aria-label="Reja bilan solishtirish">
        <ul className="flex flex-wrap items-center gap-1.5"><li className="text-muted-foreground">O'quv reja:</li>{lines(plan, () => true)}</ul>
        {plan.length > 1 && plan.map((p) => (
          <ul key={p.part} className="flex flex-wrap items-center gap-1.5">
            <li className="text-muted-foreground">{p.part}-qism ({p.semester}-semestr):</li>
            {lines([p], (t) => (t.part ?? 1) === p.part)}
          </ul>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1.5 rounded-md border p-2 text-xs" aria-label="Reja bilan solishtirish">
      <p className="font-medium">O'quv reja bilan solishtirish</p>
      <ul className="space-y-0.5">{lines(plan, () => true)}</ul>
      {plan.length > 1 && plan.map((p) => (
        <ul key={p.part} className="space-y-0.5 border-t pt-1">
          {lines([p], (t) => (t.part ?? 1) === p.part, `${p.part}-qism (${p.semester}-semestr) · `)}
        </ul>
      ))}
    </div>
  );
}

/** Kurs tuzilmasi: mavzular kursda qaysi tartibda bo'lim bo'lishi (nazariy, amaliy, laboratoriya, seminar). */
export function CoursePlanPreview({ topics }: { topics: SyllabusTopicInput[] }) {
  const ordered = TYPES.flatMap((type) => topics.filter((t) => t.type === type));
  if (ordered.length === 0) return <p className="text-xs text-muted-foreground">Mavzu qo'shilgach, kurs bo'limlari shu yerda ko'rinadi.</p>;
  return (
    <ol className="max-h-64 divide-y overflow-y-auto rounded-md border text-xs" aria-label="Kurs bo'limlari">
      {ordered.map((t, index) => (
        <li key={`${t.type}-${index}`} className="flex items-center gap-2 px-2 py-1.5">
          <span className="w-5 shrink-0 text-muted-foreground">{index + 1}.</span>
          <span className="min-w-0 flex-1 truncate">{t.title.trim() || <i className="text-muted-foreground">nomsiz mavzu</i>}</span>
          <TopicTypeBadge type={t.type} hours={Number(t.hours) || 0} suffix="s" />
        </li>
      ))}
    </ol>
  );
}

interface EditorProps {
  value: SyllabusTopicInput[];
  onChange: (value: SyllabusTopicInput[]) => void;
  /** Ko'p semestrli fan: qismlar soni (> 1 bo'lsa har bir mavzuda qism tanlanadi) */
  parts?: number;
  /** Ixcham: faqat mavzu nomi va soat (qisqa mazmun va tartib tugmalarisiz) */
  compact?: boolean;
  /** Ko'rsatiladigan mashg'ulot turlari (berilmasa hammasi) */
  types?: SyllabusTopicType[];
}

/** Fan dasturi mavzularini kiritish: har bir mashg'ulot turi (nazariy, amaliy, laboratoriya, seminar) alohida ro'yxatda. */
export function SyllabusTopicsEditor({ value, onChange, parts = 1, compact = false, types }: EditorProps) {
  const visibleTypes = types?.length ? types : TYPES;
  const [tab, setTab] = useState<SyllabusTopicType>(visibleTypes[0]);
  const [bulk, setBulk] = useState<string | null>(null);

  // Har bir tur ichida tartib saqlanadi; qayta yig'ishda turlar TYPES tartibida
  const byType = (type: SyllabusTopicType) => value.filter((t) => t.type === type);
  const replaceType = (type: SyllabusTopicType, items: SyllabusTopicInput[]) =>
    onChange(TYPES.flatMap((t) => (t === type ? items : byType(t))));

  const update = (type: SyllabusTopicType, index: number, patch: Partial<SyllabusTopicInput>) =>
    replaceType(type, byType(type).map((t, i) => (i === index ? { ...t, ...patch } : t)));
  const remove = (type: SyllabusTopicType, index: number) =>
    replaceType(type, byType(type).filter((_, i) => i !== index));
  const move = (type: SyllabusTopicType, index: number, delta: number) => {
    const items = [...byType(type)];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    replaceType(type, items);
  };
  const add = (type: SyllabusTopicType) =>
    replaceType(type, [...byType(type), { type, title: "", description: "", hours: 2, part: parts > 1 ? 1 : null }]);
  const addBulk = (type: SyllabusTopicType) => {
    const titles = (bulk ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
    if (titles.length) replaceType(type, [...byType(type), ...titles.map((title) => ({ type, title, description: "", hours: 2, part: parts > 1 ? 1 : null }))]);
    setBulk(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Mavzular</Label>
        <span className="text-xs text-muted-foreground">
          Jami: {sumHours(value)} soat ({formatTypeHours(Object.fromEntries(TYPES.map((t) => [t, sumHours(byType(t))])))})
        </span>
      </div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as SyllabusTopicType); setBulk(null); }}>
        <TabsList className="grid h-auto w-full" style={{ gridTemplateColumns: `repeat(${Math.min(visibleTypes.length, 4)}, minmax(0, 1fr))` }}>
          {visibleTypes.map((type) => (
            <TabsTrigger key={type} value={type} className="flex-col gap-0.5 py-1.5">
              <span>{topicTypeMeta[type].short}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{byType(type).length} ta · {sumHours(byType(type))} soat</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {visibleTypes.map((type) => (
          <TabsContent key={type} value={type} className="space-y-2">
            {byType(type).length === 0 && (
              <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                {topicTypeMeta[type].empty} hali kiritilmagan
              </p>
            )}
            {byType(type).map((topic, index) => (
              <div key={index} className="flex items-start gap-2 rounded-md border p-2">
                <span className="mt-2 w-6 shrink-0 text-right text-sm text-muted-foreground">{index + 1}.</span>
                <div className="flex-1 space-y-1.5">
                  <Input
                    aria-label={`${index + 1}-mavzu nomi`}
                    value={topic.title}
                    placeholder="Mavzu nomi"
                    onChange={(e) => update(type, index, { title: e.target.value })}
                  />
                  {!compact && <Input
                    aria-label={`${index + 1}-mavzu mazmuni`}
                    value={topic.description ?? ""}
                    placeholder="Qisqa mazmuni (ixtiyoriy)"
                    className="h-8 text-xs"
                    onChange={(e) => update(type, index, { description: e.target.value })}
                  />}
                </div>
                {parts > 1 && (
                  <select aria-label={`${index + 1}-mavzu qismi`} className="h-10 w-24 shrink-0 rounded-md border bg-background px-2 text-sm"
                    value={topic.part ?? 1} onChange={(e) => update(type, index, { part: Number(e.target.value) })}>
                    {Array.from({ length: parts }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}-qism</option>)}
                  </select>
                )}
                <div className="w-20 shrink-0">
                  <Input
                    aria-label={`${index + 1}-mavzu soati`}
                    type="number"
                    min={1}
                    max={200}
                    value={topic.hours}
                    onChange={(e) => update(type, index, { hours: Number(e.target.value) })}
                  />
                  <span className="text-[10px] text-muted-foreground">soat</span>
                </div>
                {!compact && <div className="flex shrink-0 flex-col">
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Yuqoriga" disabled={index === 0} onClick={() => move(type, index, -1)}><ArrowUp className="h-3 w-3" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Pastga" disabled={index === byType(type).length - 1} onClick={() => move(type, index, 1)}><ArrowDown className="h-3 w-3" /></Button>
                </div>}
                <Button type="button" size="icon" variant="ghost" className="shrink-0 text-destructive" aria-label="Mavzuni o'chirish" onClick={() => remove(type, index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {bulk !== null ? (
              <div className="space-y-2 rounded-md border p-2">
                <Textarea
                  aria-label="Mavzular ro'yxati"
                  className="min-h-24"
                  placeholder={"Har bir qatorga bitta mavzu nomi yozing\nMasalan:\nKirish. Fanning maqsadi\nAsosiy tushunchalar"}
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => addBulk(type)}>Qo'shish</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setBulk(null)}>Bekor qilish</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => add(type)}>
                  <Plus className="mr-1 h-4 w-4" />Mavzu qo'shish
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setBulk("")}>
                  <ListPlus className="mr-1 h-4 w-4" />Ro'yxatdan qo'shish
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/** Mavzularni ko'rish (dastur mazmuni va tasdiqlangan versiyalar tarixida). */
export function SyllabusTopicsView({ topics }: { topics?: SyllabusTopic[] | null }) {
  if (!topics?.length) return <p className="text-sm text-muted-foreground">Mavzular kiritilmagan.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {TYPES.filter((type) => topics.some((t) => t.type === type)).map((type) => {
        const items = topics.filter((t) => t.type === type).sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <div key={type} className="rounded-md border">
            <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-sm font-medium">
              <span>{syllabusTopicTypes[type]}</span>
              <span className="text-xs text-muted-foreground">{sumHours(items)} soat</span>
            </div>
            {items.length === 0
              ? <p className="px-3 py-2 text-sm text-muted-foreground">—</p>
              : (
                <ol className="divide-y text-sm">
                  {items.map((t) => (
                    <li key={`${type}-${t.sortOrder}`} className="flex gap-2 px-3 py-1.5">
                      <span className="w-5 shrink-0 text-muted-foreground">{t.sortOrder}.</span>
                      <span className="flex-1">
                        {t.title}
                        {t.description && <span className="block text-xs text-muted-foreground">{t.description}</span>}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{t.hours} s</span>
                    </li>
                  ))}
                </ol>
              )}
          </div>
        );
      })}
    </div>
  );
}
