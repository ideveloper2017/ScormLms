import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, UserPlus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import { curriculumApi } from "@/services/api/curriculum-api";

const message = (error: unknown) => error instanceof Error ? error.message : "Amalni bajarib bo'lmadi";

interface AdminCurriculumStudentsProps {
  /** When set, locks the page to this curriculum (embedded as a tab inside the plan editor) and hides the plan picker. */
  lockedCurriculumId?: number;
}

export function AdminCurriculumStudents({ lockedCurriculumId }: AdminCurriculumStudentsProps = {}) {
  const embedded = Number.isInteger(lockedCurriculumId) && (lockedCurriculumId as number) > 0;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [curriculumId, setCurriculumId] = useState(() => {
    if (embedded) return lockedCurriculumId as number;
    const value = Number(searchParams.get("curriculumId"));
    return Number.isInteger(value) && value > 0 ? value : 0;
  });
  const [semester, setSemester] = useState(1);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (embedded) return;
    const value = Number(searchParams.get("curriculumId"));
    setCurriculumId(Number.isInteger(value) && value > 0 ? value : 0);
  }, [searchParams, embedded]);
  useEffect(() => { if (search.trim() === term) return; const timer = setTimeout(() => { setTerm(search.trim()); setPage(0); }, 300); return () => clearTimeout(timer); }, [search, term]);
  useEffect(() => { setSelectedIds([]); setPage(0); }, [curriculumId, semester]);

  const curricula = useQuery({ queryKey: ["curricula"], queryFn: curriculumApi.list });
  const selected = curricula.data?.find((item) => item.id === curriculumId);
  const periods = useQuery({ queryKey: ["curricula", curriculumId, "semesters"], queryFn: () => curriculumApi.listSemesterPeriods(curriculumId), enabled: curriculumId > 0 });
  const assignments = useQuery({ queryKey: ["curricula", curriculumId, "student-assignments"], queryFn: () => curriculumApi.listStudentAssignments(curriculumId), enabled: curriculumId > 0 });
  const candidates = useQuery({ queryKey: ["curricula", curriculumId, "candidates", semester, term, page], queryFn: () => curriculumApi.listStudents(curriculumId, { status: "ACTIVE", semesterNumber: semester, unassignedOnly: true, search: term || undefined, page, size: 20 }), enabled: !!selected && semester <= selected.semesterCount && selected.status === "APPROVED" && selected.active });
  useEffect(() => { if (selected && semester > selected.semesterCount) setSemester(1); }, [selected, semester]);
  useEffect(() => { if (candidates.data && page > 0 && page >= candidates.data.totalPages) setPage(Math.max(0, candidates.data.totalPages - 1)); }, [candidates.data, page]);
  const period = periods.data?.find((item) => item.semesterNumber === semester);

  useEffect(() => {
    setStartsOn(period?.startsOn ?? "");
    setEndsOn(period?.endsOn ?? "");
  }, [period?.startsOn, period?.endsOn, semester, curriculumId]);

  const assignedIds = useMemo(() => new Set((assignments.data ?? []).filter((item) => item.semesterNumber === semester).map((item) => item.studentId)), [assignments.data, semester]);
  const visibleCandidates = (candidates.data?.items ?? []).filter((item) => item.semesterNumber === semester && !assignedIds.has(item.studentId));
  const chooseCurriculum = (value: number) => {
    setCurriculumId(value);
    setSemester(1);
    setSelectedIds([]);
    setPage(0);
    if (value > 0) setSearchParams({ curriculumId: String(value) });
    else setSearchParams({});
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["curricula", curriculumId, "semesters"] }),
      queryClient.invalidateQueries({ queryKey: ["curricula", curriculumId, "student-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["curricula", curriculumId, "candidates"] }),
    ]);
  };
  const savePeriod = useMutation({
    mutationFn: () => curriculumApi.saveSemesterPeriod(curriculumId, { semesterNumber: semester, startsOn, endsOn, active: true }),
    onSuccess: async () => { await refresh(); toast({ title: `${semester}-semestr muddati saqlandi` }); },
    onError: (error) => toast({ title: "Semestr saqlanmadi", description: message(error), variant: "destructive" }),
  });
  const assign = useMutation({
    mutationFn: () => curriculumApi.assignStudents(curriculumId, selectedIds, semester),
    onSuccess: async () => { setSelectedIds([]); await refresh(); toast({ title: "Talabalar o'quv rejaga biriktirildi" }); },
    onError: (error) => toast({ title: "Biriktirish bajarilmadi", description: message(error), variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (assignmentId: number) => curriculumApi.removeStudentAssignment(curriculumId, assignmentId),
    onSuccess: async () => { await refresh(); toast({ title: "Biriktirish olib tashlandi" }); },
    onError: (error) => toast({ title: "Olib tashlab bo'lmadi", description: message(error), variant: "destructive" }),
  });

  const busy = savePeriod.isPending || assign.isPending || remove.isPending;
  const failed = periods.isError || assignments.isError || candidates.isError;
  const periodError = !startsOn || !endsOn ? 'Boshlanish va tugash sanalarini kiriting.' : endsOn <= startsOn ? 'Tugash sanasi boshlanishidan keyin bo‘lishi kerak.'
    : selected && (startsOn < selected.validFrom || endsOn > selected.validUntil) ? `Sanalar ${selected.validFrom} — ${selected.validUntil} oralig‘ida bo‘lishi kerak.` : null;
  const blocked = !selected ? 'Avval o‘quv rejani tanlang.' : selected.status !== 'APPROVED' ? 'Reja tasdiqlangan bo‘lishi kerak.' : !selected.active ? 'O‘quv reja faol emas.' : !period?.active ? 'Avval tanlangan semestrning faol muddatini saqlang.' : null;

  return <div className={embedded ? "space-y-6" : "space-y-6 p-3 sm:p-6"}>
    {!embedded && <div><h1 className="text-2xl font-bold">O'quv rejaga biriktirilgan talabalar</h1><p className="text-sm text-muted-foreground">ELMS zanjiri: tasdiqlangan o'quv reja → semestr muddati → mos talabalarni biriktirish.</p></div>}
    {!embedded && curricula.isSuccess && curricula.data.length === 0 && <Card><CardContent className="space-y-3 py-10 text-center"><p className="text-muted-foreground">Talaba biriktirish uchun avval o'quv reja yarating va kamida bitta fan bilan tasdiqlang.</p><Button onClick={() => navigate("/edu-process/curriculum")}>O'quv rejaga o'tish</Button></CardContent></Card>}
    {curricula.isPending && <p role="status">O'quv rejalar yuklanmoqda...</p>}
    {curricula.isError && <div role="alert" className="rounded border p-3 text-destructive">Rejalarni yuklab bo'lmadi. <Button variant="outline" onClick={() => void curricula.refetch()}>Qayta urinish</Button></div>}
    <Card><CardHeader><CardTitle>Semestr muddati</CardTitle><CardDescription>Talabaning yo'nalishi, o'quv yili va semestri rejaga mos bo'lishi shart.</CardDescription></CardHeader><CardContent className={embedded ? "grid gap-4 md:grid-cols-3" : "grid gap-4 md:grid-cols-4"}>
      {!embedded && <div className="space-y-2 md:col-span-2"><Label>O'quv reja</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" aria-label="O'quv reja" disabled={busy} value={curriculumId} onChange={(event) => chooseCurriculum(Number(event.target.value))}><option value={0}>Rejani tanlang</option>{(curricula.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.programName} · {item.versionCode} · {item.academicYear} ({item.status})</option>)}</select></div>}
      <div className="space-y-2"><Label>Semestr</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" aria-label="Semestr" disabled={!selected || busy} value={semester} onChange={(event) => setSemester(Number(event.target.value))}>{Array.from({ length: selected?.semesterCount ?? 1 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}-semestr</option>)}</select></div>
      <div className="flex items-end"><Badge variant={selected?.status === "APPROVED" ? "default" : "secondary"}>{selected?.status ?? "Reja tanlanmagan"}</Badge></div>
      <div className="space-y-2"><Label>Boshlanish sanasi</Label><Input aria-label="Boshlanish sanasi" disabled={!canWrite || busy} min={selected?.validFrom} max={selected?.validUntil} type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} /></div>
      <div className="space-y-2"><Label>Tugash sanasi</Label><Input aria-label="Tugash sanasi" disabled={!canWrite || busy} min={selected?.validFrom} max={selected?.validUntil} type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} /></div>
      <div className="flex items-end md:col-span-2"><Button disabled={!canWrite || !selected || selected.status === "ARCHIVED" || !!periodError || periods.isPending || periods.isError || busy} onClick={() => savePeriod.mutate()}><Save className="mr-2 h-4 w-4" />Semestr muddatini saqlash</Button></div>
      {periodError && <p className="text-sm text-muted-foreground md:col-span-4">{periodError}</p>}
    </CardContent></Card>

    <div className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Biriktirish mumkin bo'lgan talabalar</CardTitle><CardDescription>Faqat tanlangan semestrdagi, hali biriktirilmagan talabalar ko'rsatiladi.</CardDescription></CardHeader><CardContent className="space-y-3">
        {failed && <div role="alert">Ma'lumotlarni yuklab bo'lmadi. <Button variant="outline" onClick={() => void refresh()}>Qayta urinish</Button></div>}
        {blocked && <p role="status" className="rounded bg-muted p-3 text-sm">{blocked}</p>}
        <Input aria-label="Talaba qidirish" placeholder="F.I.O. yoki talaba raqami" maxLength={100} value={search} disabled={busy} onChange={event => setSearch(event.target.value)} />
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!canWrite || !!blocked || busy || failed || !visibleCandidates.length} onClick={() => setSelectedIds(current => [...new Set([...current, ...visibleCandidates.map(item => item.studentId)])].slice(0, 200))}>Sahifadagilarni tanlash</Button><Button variant="ghost" size="sm" disabled={busy || !selectedIds.length} onClick={() => setSelectedIds([])}>Tanlovni tozalash</Button></div>
        {candidates.isFetching && <p role="status">Talabalar yuklanmoqda...</p>}
        {visibleCandidates.map((student) => <label key={student.studentId} className="flex cursor-pointer items-center gap-3 rounded-md border p-3"><input type="checkbox" disabled={!canWrite || !!blocked || busy || failed || (!selectedIds.includes(student.studentId) && selectedIds.length >= 200)} checked={selectedIds.includes(student.studentId)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, student.studentId] : current.filter((id) => id !== student.studentId))} /><span className="min-w-0 flex-1"><span className="block font-medium">{student.fullName}</span><span className="text-xs text-muted-foreground">{student.studentNumber} · {student.groupName ?? "Guruhsiz"}</span></span></label>)}
        {candidates.isSuccess && !failed && visibleCandidates.length === 0 && <div className="space-y-2 py-8 text-center text-muted-foreground"><p>Qidiruvga mos, hali biriktirilmagan faol talaba topilmadi.</p><Button variant="outline" size="sm" onClick={() => navigate("/admin/students")}>Talabalarni tekshirish</Button></div>}
        {candidates.data && <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{candidates.data.totalElements} talaba · {page + 1}/{Math.max(1, candidates.data.totalPages)}-sahifa</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy || candidates.isFetching || page === 0} onClick={() => setPage(page - 1)}>Oldingi</Button><Button size="sm" variant="outline" disabled={busy || candidates.isFetching || page + 1 >= candidates.data.totalPages} onClick={() => setPage(page + 1)}>Keyingi</Button></div></div>}
        <Button disabled={!canWrite || !!blocked || failed || selectedIds.length === 0 || candidates.isFetching || busy} onClick={() => assign.mutate()}><UserPlus className="mr-2 h-4 w-4" />Tanlanganlarni biriktirish ({selectedIds.length})</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Biriktirilgan talabalar</CardTitle><CardDescription>{semester}-semestr bo'yicha amaldagi ro'yxat.</CardDescription></CardHeader><CardContent className="space-y-3">
        {(assignments.data ?? []).filter((item) => item.semesterNumber === semester).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium">{item.fullName}</p><p className="text-xs text-muted-foreground">{item.studentNumber} · {item.startsOn} — {item.endsOn}</p></div>{canWrite && <Button size="icon" variant="ghost" disabled={busy} onClick={() => remove.mutate(item.id)} aria-label="Biriktirishni olib tashlash"><Trash2 className="h-4 w-4" /></Button>}</div>)}
        {assignments.isSuccess && !(assignments.data ?? []).some((item) => item.semesterNumber === semester) && <p className="py-8 text-center text-muted-foreground">Hali talaba biriktirilmagan.</p>}
      </CardContent></Card>
    </div>
  </div>;
}
