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
import { creditWorkload, validateTopics } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  syllabusApi, syllabusTopicTypes,
  type SubjectSyllabus, type SyllabusTopic, type SyllabusTopicInput, type SyllabusTopicType,
} from "@/services/api/syllabus-api";

const TYPES: SyllabusTopicType[] = ["THEORETICAL", "PRACTICAL"];


/**
 * O'quv dasturi mavzularini alohida boshqarish (dastur yaratilgandan keyin).
 * Faqat qoralama dasturda tahrirlanadi; aks holda ko'rish rejimida ochiladi.
 */
export function SyllabusTopicsDialog({ item, canWrite, credits, onClose, onSaved }: {
  item: SubjectSyllabus;
  canWrite: boolean;
  /** Fan krediti — yuklama hisobi uchun */
  credits?: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const editable = canWrite && item.status === "DRAFT";
  const [topics, setTopics] = useState<SyllabusTopicInput[]>(
    (item.topics ?? []).map((t) => ({ id: t.id, type: t.type, title: t.title, description: t.description ?? "", hours: t.hours })),
  );
  const [error, setError] = useState<string | null>(null);
  const courses = useQuery({
    queryKey: ["syllabus-courses", item.id],
    queryFn: () => syllabusApi.linkedCourses(item.id),
  });
  const save = useMutation({
    mutationFn: () => syllabusApi.updateTopicsWithCourses(item.id, topics.map((t) => ({
      id: t.id ?? null, type: t.type, title: t.title.trim(), description: t.description?.trim() || null, hours: Number(t.hours),
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
          <DialogTitle>Mavzular — {item.name}</DialogTitle>
          <DialogDescription>
            {item.subjectCode ? `${item.subjectCode} · ` : ""}{item.subjectName}.{" "}
            {editable
              ? "Nazariy va amaliy mashg'ulot mavzulari hamda soatlarini kiriting. Mavzular mazmuni (darslar, materiallar) kurs modulida to'ldiriladi."
              : "Mavzular faqat qoralama dasturda tahrirlanadi — tahrirlash uchun yangi versiya oching."}
          </DialogDescription>
        </DialogHeader>
        {editable
          ? <SyllabusTopicsEditor value={topics} onChange={(value) => { setTopics(value); setError(null); }} />
          : <SyllabusTopicsView topics={item.topics} />}
        <CreditWorkload credits={credits} topics={editable ? topics : item.topics ?? []} />
        {(courses.data?.length ?? 0) > 0 && (
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

/** Kredit-modul tizimidagi yuklama: auditoriya (nazariy + amaliy) va mustaqil ta'lim soatlari. */
export function CreditWorkload({ credits, topics }: { credits?: number | null; topics: Pick<SyllabusTopicInput, "hours">[] }) {
  const auditory = sumHours(topics);
  if (!credits) {
    return <p className="text-xs text-muted-foreground">Auditoriya soatlari: {auditory}. Fan krediti ko'rsatilmagan — mustaqil ta'lim hisoblanmadi.</p>;
  }
  const load = creditWorkload(credits, auditory);
  return (
    <p role={load.exceeded ? "alert" : "status"} className={cn("rounded-md border p-2 text-xs",
      load.exceeded ? "border-destructive text-destructive" : "bg-muted/40")}>
      Fan krediti: {credits} → umumiy yuklama {load.total} soat. Auditoriya (nazariy + amaliy): {load.auditory} soat ·
      mustaqil ta'lim: {Math.max(load.selfStudy, 0)} soat
      {load.exceeded && " — auditoriya soatlari kredit hajmidan oshib ketdi"}
    </p>
  );
}

/** Kurs tuzilmasi: mavzular kursda qaysi tartibda bo'lim bo'lishi (avval nazariy, keyin amaliy). */
export function CoursePlanPreview({ topics }: { topics: SyllabusTopicInput[] }) {
  const ordered = TYPES.flatMap((type) => topics.filter((t) => t.type === type));
  if (ordered.length === 0) return <p className="text-xs text-muted-foreground">Mavzu qo'shilgach, kurs bo'limlari shu yerda ko'rinadi.</p>;
  return (
    <ol className="max-h-64 divide-y overflow-y-auto rounded-md border text-xs" aria-label="Kurs bo'limlari">
      {ordered.map((t, index) => (
        <li key={`${t.type}-${index}`} className="flex items-center gap-2 px-2 py-1.5">
          <span className="w-5 shrink-0 text-muted-foreground">{index + 1}.</span>
          <span className="min-w-0 flex-1 truncate">{t.title.trim() || <i className="text-muted-foreground">nomsiz mavzu</i>}</span>
          <Badge variant="outline" className={cn("shrink-0", t.type === "THEORETICAL"
            ? "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
            : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300")}>
            {t.type === "THEORETICAL" ? "Nazariy" : "Amaliy"} · {Number(t.hours) || 0} s
          </Badge>
        </li>
      ))}
    </ol>
  );
}

interface EditorProps {
  value: SyllabusTopicInput[];
  onChange: (value: SyllabusTopicInput[]) => void;
}

/** Fan dasturi mavzularini kiritish: nazariy va amaliy mashg'ulotlar alohida ro'yxatda. */
export function SyllabusTopicsEditor({ value, onChange }: EditorProps) {
  const [tab, setTab] = useState<SyllabusTopicType>("THEORETICAL");
  const [bulk, setBulk] = useState<string | null>(null);

  // Har bir tur ichida tartib saqlanadi; qayta yig'ishda avval nazariy, keyin amaliy
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
    replaceType(type, [...byType(type), { type, title: "", description: "", hours: 2 }]);
  const addBulk = (type: SyllabusTopicType) => {
    const titles = (bulk ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
    if (titles.length) replaceType(type, [...byType(type), ...titles.map((title) => ({ type, title, description: "", hours: 2 }))]);
    setBulk(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Mavzular</Label>
        <span className="text-xs text-muted-foreground">
          Jami: {sumHours(value)} soat (nazariy {sumHours(byType("THEORETICAL"))}, amaliy {sumHours(byType("PRACTICAL"))})
        </span>
      </div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as SyllabusTopicType); setBulk(null); }}>
        <TabsList className="grid h-auto w-full grid-cols-2">
          {TYPES.map((type) => (
            <TabsTrigger key={type} value={type} className="gap-2">
              {type === "THEORETICAL" ? "Nazariy" : "Amaliy"}
              <Badge variant="secondary" className="shrink-0">{byType(type).length} ta · {sumHours(byType(type))} soat</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {TYPES.map((type) => (
          <TabsContent key={type} value={type} className="space-y-2">
            {byType(type).length === 0 && (
              <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                {type === "THEORETICAL" ? "Nazariy (ma'ruza) mavzulari" : "Amaliy mashg'ulot mavzulari"} hali kiritilmagan
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
                  <Input
                    aria-label={`${index + 1}-mavzu mazmuni`}
                    value={topic.description ?? ""}
                    placeholder="Qisqa mazmuni (ixtiyoriy)"
                    className="h-8 text-xs"
                    onChange={(e) => update(type, index, { description: e.target.value })}
                  />
                </div>
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
                <div className="flex shrink-0 flex-col">
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Yuqoriga" disabled={index === 0} onClick={() => move(type, index, -1)}><ArrowUp className="h-3 w-3" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Pastga" disabled={index === byType(type).length - 1} onClick={() => move(type, index, 1)}><ArrowDown className="h-3 w-3" /></Button>
                </div>
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
      {TYPES.map((type) => {
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
