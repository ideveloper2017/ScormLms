import { useMemo, useState, type DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Clock, GripVertical, Loader2, MoreHorizontal, Pencil, Plus, Search, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EditSubjectDialog } from "@/components/admin/curriculum-subjects-table";
import { LinkSyllabusDialog } from "@/components/admin/curriculum-syllabus-link";
import { CurriculumTeacherDialog } from "@/components/admin/curriculum-teacher-dialog";
import { useToast } from "@/hooks/use-toast";
import { extractApiError, type SubjectRecord } from "@/lib/academic-api";
import { HOURS_PER_CREDIT } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import {
  courseWorkLabels, curriculumApi, type CurriculumComponent, type CurriculumSubject,
} from "@/services/api/curriculum-api";

type DragPayload = { kind: "catalog"; subjectId: number } | { kind: "item"; itemId: number; semester: number };

const totalHours = (s: CurriculumSubject) => s.totalHours ?? (s.auditoryHours ?? 0) + (s.selfStudyHours ?? 0);

const rowOrder = (a: CurriculumSubject, b: CurriculumSubject) =>
  (a.planRowNumber ?? "~").localeCompare(b.planRowNumber ?? "~", undefined, { numeric: true })
  || a.subjectName.localeCompare(b.subjectName);

/** Bir T/r raqamli tanlov fanlari bitta guruh (muqobillar), qolganlari alohida */
const groupElectives = (items: CurriculumSubject[]) => {
  const groups = new Map<string, CurriculumSubject[]>();
  for (const s of [...items].sort(rowOrder)) {
    const key = s.planItemType === "ELECTIVE" && s.planRowNumber ? `e:${s.planRowNumber}` : `i:${s.id}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups.values()];
};

/**
 * O'quv reja fanlari semestrlar bo'yicha: chapda fanlar katalogi, o'ngda semestr bloklari (jami soat/kredit).
 * Fan katalogdan semestrga sudrab qo'shiladi, semestrlar orasida sudrab ko'chiriladi; sichqonchasiz —
 * "+" va "⋯" menyulari orqali. Kredit va soatlar mavjud tahrirlash oynasida.
 */
export function CurriculumSubjectBoard({ curriculumId, subjects, components, catalog, semesters, editable, onRemove, onChanged }: {
  curriculumId: number;
  subjects: CurriculumSubject[];
  components: CurriculumComponent[];
  /** Rejaga qo'shish mumkin bo'lgan fanlar (umumiy katalog + dastur fanlari) */
  catalog: SubjectRecord[];
  semesters: number[];
  /** Qo'shish, ko'chirish, tahrirlash va olib tashlash (faqat qoralama reja) */
  editable: boolean;
  onRemove: (subject: CurriculumSubject) => void;
  onChanged: () => unknown;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState(0);
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [pendingSemester, setPendingSemester] = useState<number | null>(null);
  const [editing, setEditing] = useState<CurriculumSubject | null>(null);
  const [linking, setLinking] = useState<CurriculumSubject | null>(null);
  const [staffing, setStaffing] = useState<CurriculumSubject | null>(null);

  const fail = (title: string) => (e: unknown) =>
    toast({ variant: "destructive", title, description: extractApiError(e, "Xatolik").message });
  const done = async () => { await onChanged(); setPendingSemester(null); };
  const add = useMutation({
    mutationFn: ({ subjectId, semester }: { subjectId: number; semester: number }) =>
      curriculumApi.addSubject(curriculumId, { subjectId, semester, planItemType: "REQUIRED" }),
    onSuccess: done,
    onError: (e) => { setPendingSemester(null); fail("Fan qo'shilmadi")(e); },
  });
  const move = useMutation({
    mutationFn: ({ itemId, semester }: { itemId: number; semester: number }) =>
      curriculumApi.moveSubject(curriculumId, itemId, semester),
    onSuccess: done,
    onError: (e) => { setPendingSemester(null); fail("Fan ko'chirilmadi")(e); },
  });
  const busy = add.isPending || move.isPending;

  const place = (payload: DragPayload, semester: number) => {
    if (payload.kind === "item") {
      if (payload.semester === semester) return;
      setPendingSemester(semester);
      move.mutate({ itemId: payload.itemId, semester });
    } else {
      setPendingSemester(semester);
      add.mutate({ subjectId: payload.subjectId, semester });
    }
  };

  const plannedSemesters = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const s of subjects) if (s.subjectId != null) map.set(s.subjectId, [...(map.get(s.subjectId) ?? []), s.semester]);
    return map;
  }, [subjects]);
  const categories = useMemo(() => [...new Map(catalog
    .filter((s) => s.subjectCategoryId && s.subjectCategoryName)
    .map((s) => [s.subjectCategoryId!, s.subjectCategoryName!])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1])), [catalog]);
  const needle = query.trim().toLowerCase();
  const visibleCatalog = catalog
    .filter((s) => s.active && (!categoryId || s.subjectCategoryId === categoryId))
    .filter((s) => !needle || s.name.toLowerCase().includes(needle) || (s.code ?? "").toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name));

  const startDrag = (payload: DragPayload) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = payload.kind === "catalog" ? "copy" : "move";
    // Firefox ma'lumotsiz sudrashni boshlamaydi
    e.dataTransfer.setData("text/plain", payload.kind === "catalog" ? `subject:${payload.subjectId}` : `item:${payload.itemId}`);
    setDragging(payload);
  };
  const endDrag = () => { setDragging(null); setOver(null); };

  return (
    <>
      {editing && <EditSubjectDialog curriculumId={curriculumId} subject={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
      {linking && <LinkSyllabusDialog curriculumId={curriculumId} subject={linking} onClose={() => setLinking(null)}
        onLinked={async () => { await onChanged(); setLinking(null); }} />}
      {staffing && <CurriculumTeacherDialog curriculumId={curriculumId} subject={staffing} onClose={() => setStaffing(null)} onSaved={onChanged} />}
      <div className={cn("grid gap-4", editable && "lg:grid-cols-[280px_minmax(0,1fr)]")}>
        {editable && (
          <aside aria-label="Fanlar katalogi" className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Fan nomi yoki kodi" aria-label="Fan qidirish" className="pl-8" />
            </div>
            {categories.length > 0 && (
              <select aria-label="Fan guruhi" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}>
                <option value={0}>Barcha fan guruhlari</option>
                {categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            )}
            <p className="text-xs text-muted-foreground">Fanni kerakli semestrga sudrab tashlang yoki "+" tugmasini bosing.</p>
            <ul className="-mr-1 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {visibleCatalog.map((s) => {
                const planned = plannedSemesters.get(s.id);
                return (
                  <li key={s.id} draggable={!busy} onDragStart={startDrag({ kind: "catalog", subjectId: s.id })} onDragEnd={endDrag}
                    className="flex cursor-grab items-center gap-2 rounded-md border bg-background p-2 text-sm shadow-sm active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium leading-snug" title={s.name}>{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.code ?? "kodsiz"}
                        {planned && ` · rejada: ${[...planned].sort((a, b) => a - b).join(", ")}-sem.`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={busy} aria-label={`${s.name} — semestrga qo'shish`}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Qaysi semestrga?</DropdownMenuLabel>
                        {semesters.map((n) => (
                          <DropdownMenuItem key={n} disabled={planned?.includes(n)} onClick={() => place({ kind: "catalog", subjectId: s.id }, n)}>
                            {n}-semestr
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
              {visibleCatalog.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Fan topilmadi</li>}
            </ul>
          </aside>
        )}

        <div className="grid content-start gap-4 xl:grid-cols-2">
          {semesters.map((n) => {
            const items = subjects.filter((s) => s.semester === n);
            const parts = components.filter((c) => c.semester === n);
            const credits = items.reduce((sum, s) => sum + s.credits, 0) + parts.reduce((sum, c) => sum + c.credits, 0);
            const hours = items.reduce((sum, s) => sum + totalHours(s), 0) + parts.reduce((sum, c) => sum + c.hours, 0);
            const droppable = editable && dragging !== null && !(dragging.kind === "item" && dragging.semester === n);
            return (
              <section key={n} aria-label={`${n}-semestr`}
                onDragOver={(e) => { if (!droppable) return; e.preventDefault(); setOver(n); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((v) => (v === n ? null : v)); }}
                onDrop={(e) => { e.preventDefault(); if (droppable && dragging) place(dragging, n); endDrag(); }}
                className={cn("overflow-hidden rounded-xl border bg-card transition-shadow",
                  droppable && "border-dashed border-primary/60", over === n && droppable && "ring-2 ring-primary")}>
                <header className="flex items-center justify-between gap-3 bg-primary px-4 py-2.5 text-primary-foreground">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    {n}-semestr
                    {pendingSemester === n && <Loader2 className="h-4 w-4 animate-spin" aria-label="Saqlanmoqda" />}
                  </h3>
                  <span className="text-base font-semibold tabular-nums" title="Jami soat / kredit">{hours}/{credits}</span>
                </header>
                <div className="min-h-[84px] space-y-2 p-3">
                  {groupElectives(items).map((group) => {
                    const cards = group.map((s) => (
                      <SubjectCard key={s.id} subject={s} editable={editable} busy={busy} semesters={semesters}
                        onDragStart={startDrag({ kind: "item", itemId: s.id, semester: s.semester })} onDragEnd={endDrag}
                        onEdit={() => setEditing(s)} onMove={(to) => place({ kind: "item", itemId: s.id, semester: s.semester }, to)}
                        onSyllabus={() => setLinking(s)} onTeacher={() => setStaffing(s)}
                        onRemove={() => onRemove(s)} />
                    ));
                    return group.length > 1 ? (
                      <div key={`g-${group[0].id}`} className="space-y-2 rounded-lg border border-dashed p-2">
                        <p className="px-1 text-xs font-medium text-muted-foreground">Tanlov fanlari · {group[0].planRowNumber}</p>
                        {cards}
                      </div>
                    ) : cards;
                  })}
                  {parts.map((c) => (
                    <div key={`c-${c.id}`} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                      <span className="truncate" title={c.name}>{c.name}</span>
                      <Badge variant="secondary" className="shrink-0 tabular-nums">{c.hours}/{c.credits}</Badge>
                    </div>
                  ))}
                  {items.length === 0 && parts.length === 0 && (
                    <p className="py-5 text-center text-sm text-muted-foreground">
                      {editable ? "Fanni shu yerga sudrab tashlang" : "Bu semestrda fan yo'q"}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

function SubjectCard({ subject: s, editable, busy, semesters, onDragStart, onDragEnd, onEdit, onMove, onRemove, onSyllabus, onTeacher }: {
  subject: CurriculumSubject;
  editable: boolean;
  busy: boolean;
  semesters: number[];
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onMove: (semester: number) => void;
  onRemove: () => void;
  onSyllabus: () => void;
  onTeacher: () => void;
}) {
  const hours = totalHours(s);
  const hoursState = hours === 0 ? "empty" : hours === s.credits * HOURS_PER_CREDIT ? "ok" : "warn";
  const hoursTitle = {
    empty: "Soatlar kiritilmagan",
    ok: "Soatlar kreditga mos",
    warn: `Soatlar kreditga mos emas: ${s.credits} kredit uchun ${s.credits * HOURS_PER_CREDIT} soat bo'lishi kerak`,
  }[hoursState];
  const syllabusState = !s.syllabusId ? "empty" : s.syllabusComplete ? "ok" : "warn";
  const syllabusTitle = {
    empty: "O'quv dasturi biriktirilmagan (\"O'quv dasturi\" bo'limida)",
    ok: `O'quv dasturi: ${s.syllabusName ?? ""} — mavzular to'liq`,
    warn: `O'quv dasturi: ${s.syllabusName ?? ""} — mavzular to'liq emas`,
  }[syllabusState];
  const tone = (state: string) =>
    state === "ok" ? "text-emerald-600 dark:text-emerald-400" : state === "warn" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/60";

  // Dastur va o'qituvchi — kartaning pastki qatorida, bosiladigan (tahrir rejimida) va uzun nom qisqartiriladi
  const link = (props: { label: string; title: string; value: string; empty: boolean; icon: typeof BookOpen; tone: string; onClick: () => void }) => {
    const body = <>
      <props.icon className={cn("h-3.5 w-3.5 shrink-0", props.tone)} aria-hidden="true" />
      <span className={cn("truncate", props.empty && "text-muted-foreground")}>{props.value}</span>
    </>;
    const className = "flex min-w-0 items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 text-left text-xs";
    return editable
      ? <button type="button" disabled={busy} title={props.title} aria-label={props.label} onClick={props.onClick} className={cn(className, "hover:bg-muted")}>{body}</button>
      : <span title={props.title} className={className}>{body}</span>;
  };

  return (
    <div draggable={editable && !busy} onDragStart={onDragStart} onDragEnd={onDragEnd}
      className={cn("space-y-2 rounded-lg border bg-background p-3 shadow-sm", editable && "cursor-grab active:cursor-grabbing")}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug" title={s.subjectName}>{s.subjectName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{s.planRowNumber ? `${s.planRowNumber} · ` : ""}{s.subjectCode}</span>
            {s.planItemType === "ELECTIVE" && <Badge variant="outline" className="px-1.5 py-0 text-[10px]">Tanlov</Badge>}
            {s.courseWorkType && <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{courseWorkLabels[s.courseWorkType]}</Badge>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Badge className="tabular-nums" title="Soat / kredit">{hours}/{s.credits}</Badge>
          <span title={hoursTitle} className="px-1"><Clock className={cn("h-4 w-4", tone(hoursState))} aria-label={hoursTitle} /></span>
          {editable && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy} onClick={onEdit} aria-label={`${s.subjectName} — kredit va soatlar`}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy} aria-label={`${s.subjectName} — amallar`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onSyllabus}>O'quv dasturini biriktirish</DropdownMenuItem>
                  <DropdownMenuItem onClick={onTeacher}>O'qituvchini biriktirish</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Boshqa semestrga ko'chirish</DropdownMenuLabel>
                  {semesters.filter((n) => n !== s.semester).map((n) => (
                    <DropdownMenuItem key={n} onClick={() => onMove(n)}>{n}-semestr</DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={onRemove}>Rejadan olib tashlash</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {link({ label: `${s.subjectName} — o'quv dasturi`, title: syllabusTitle, value: `Dastur: ${s.syllabusName ?? "yo'q"}`,
          empty: !s.syllabusName, icon: BookOpen, tone: tone(syllabusState), onClick: onSyllabus })}
        {link({ label: `${s.subjectName} — o'qituvchi`, title: s.teacherName ? `O'qituvchi: ${s.teacherName}` : "O'qituvchi biriktirilmagan",
          value: `O'qituvchi: ${s.teacherName ?? "yo'q"}`, empty: !s.teacherName, icon: UserRound,
          tone: s.teacherId ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60", onClick: onTeacher })}
      </div>
    </div>
  );
}
