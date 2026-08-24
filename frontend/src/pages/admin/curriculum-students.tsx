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

export function AdminCurriculumStudents() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [curriculumId, setCurriculumId] = useState(() => {
    const value = Number(searchParams.get("curriculumId"));
    return Number.isInteger(value) && value > 0 ? value : 0;
  });
  const [semester, setSemester] = useState(1);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const curricula = useQuery({ queryKey: ["curricula"], queryFn: curriculumApi.list });
  const selected = curricula.data?.find((item) => item.id === curriculumId);
  const periods = useQuery({ queryKey: ["curricula", curriculumId, "semesters"], queryFn: () => curriculumApi.listSemesterPeriods(curriculumId), enabled: curriculumId > 0 });
  const assignments = useQuery({ queryKey: ["curricula", curriculumId, "student-assignments"], queryFn: () => curriculumApi.listStudentAssignments(curriculumId), enabled: curriculumId > 0 });
  const candidates = useQuery({ queryKey: ["curricula", curriculumId, "students", semester], queryFn: () => curriculumApi.listStudents(curriculumId, { status: "ACTIVE", page: 0, size: 100 }), enabled: curriculumId > 0 });

  useEffect(() => {
    const period = periods.data?.find((item) => item.semesterNumber === semester);
    setStartsOn(period?.startsOn ?? "");
    setEndsOn(period?.endsOn ?? "");
    setSelectedIds([]);
  }, [periods.data, semester, curriculumId]);

  const assignedIds = useMemo(() => new Set((assignments.data ?? []).filter((item) => item.semesterNumber === semester).map((item) => item.studentId)), [assignments.data, semester]);
  const visibleCandidates = (candidates.data?.items ?? []).filter((item) => item.semesterNumber === semester && !assignedIds.has(item.studentId));
  const chooseCurriculum = (value: number) => {
    setCurriculumId(value);
    if (value > 0) setSearchParams({ curriculumId: String(value) });
    else setSearchParams({});
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["curricula", curriculumId, "semesters"] }),
      queryClient.invalidateQueries({ queryKey: ["curricula", curriculumId, "student-assignments"] }),
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

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">O'quv rejaga biriktirilgan talabalar</h1><p className="text-sm text-muted-foreground">ELMS zanjiri: tasdiqlangan o'quv reja → semestr muddati → mos talabalarni biriktirish.</p></div>
    {!curricula.isLoading && (curricula.data ?? []).length === 0 && <Card><CardContent className="space-y-3 py-10 text-center"><p className="text-muted-foreground">Talaba biriktirish uchun avval o'quv reja yarating va kamida bitta fan bilan tasdiqlang.</p><Button onClick={() => navigate("/admin/study-plans")}>O'quv rejaga o'tish</Button></CardContent></Card>}
    <Card><CardHeader><CardTitle>O'quv reja va semestr</CardTitle><CardDescription>Talabaning yo'nalishi, o'quv yili va semestri rejaga mos bo'lishi shart.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-4">
      <div className="space-y-2 md:col-span-2"><Label>O'quv reja</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={curriculumId} onChange={(event) => chooseCurriculum(Number(event.target.value))}><option value={0}>Rejani tanlang</option>{(curricula.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.programName} · {item.versionCode} · {item.academicYear} ({item.status})</option>)}</select></div>
      <div className="space-y-2"><Label>Semestr</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={semester} onChange={(event) => setSemester(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}-semestr</option>)}</select></div>
      <div className="flex items-end"><Badge variant={selected?.status === "APPROVED" ? "default" : "secondary"}>{selected?.status ?? "Reja tanlanmagan"}</Badge></div>
      <div className="space-y-2"><Label>Boshlanish sanasi</Label><Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} /></div>
      <div className="space-y-2"><Label>Tugash sanasi</Label><Input type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} /></div>
      <div className="flex items-end md:col-span-2"><Button disabled={!canWrite || !curriculumId || !startsOn || !endsOn || savePeriod.isPending} onClick={() => savePeriod.mutate()}><Save className="mr-2 h-4 w-4" />Semestr muddatini saqlash</Button></div>
    </CardContent></Card>

    <div className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Biriktirish mumkin bo'lgan talabalar</CardTitle><CardDescription>Faqat tanlangan semestrdagi, hali biriktirilmagan talabalar ko'rsatiladi.</CardDescription></CardHeader><CardContent className="space-y-3">
        {(periods.isError || assignments.isError || candidates.isError) && <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">Ma'lumotlarni yuklab bo'lmadi. Backend ulanishi va akademik ruxsatlarni tekshiring.</p>}
        {visibleCandidates.map((student) => <label key={student.studentId} className="flex cursor-pointer items-center gap-3 rounded-md border p-3"><input type="checkbox" checked={selectedIds.includes(student.studentId)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, student.studentId] : current.filter((id) => id !== student.studentId))} /><span className="min-w-0 flex-1"><span className="block font-medium">{student.fullName}</span><span className="text-xs text-muted-foreground">{student.studentNumber} · {student.groupName ?? "Guruhsiz"}</span></span></label>)}
        {curriculumId > 0 && !candidates.isLoading && visibleCandidates.length === 0 && <div className="space-y-2 py-8 text-center text-muted-foreground"><p>Shu yo'nalish, o'quv yili va semestrga mos faol talaba topilmadi.</p><Button variant="outline" size="sm" onClick={() => navigate("/admin/students")}>Talabalarni tekshirish</Button></div>}
        <Button disabled={!canWrite || selected?.status !== "APPROVED" || selectedIds.length === 0 || !periods.data?.some((item) => item.semesterNumber === semester && item.active) || assign.isPending} onClick={() => assign.mutate()}><UserPlus className="mr-2 h-4 w-4" />Tanlanganlarni biriktirish ({selectedIds.length})</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Biriktirilgan talabalar</CardTitle><CardDescription>{semester}-semestr bo'yicha amaldagi ro'yxat.</CardDescription></CardHeader><CardContent className="space-y-3">
        {(assignments.data ?? []).filter((item) => item.semesterNumber === semester).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium">{item.fullName}</p><p className="text-xs text-muted-foreground">{item.studentNumber} · {item.startsOn} — {item.endsOn}</p></div>{canWrite && <Button size="icon" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(item.id)} aria-label="Biriktirishni olib tashlash"><Trash2 className="h-4 w-4" /></Button>}</div>)}
        {curriculumId > 0 && !(assignments.data ?? []).some((item) => item.semesterNumber === semester) && <p className="py-8 text-center text-muted-foreground">Hali talaba biriktirilmagan.</p>}
      </CardContent></Card>
    </div>
  </div>;
}
