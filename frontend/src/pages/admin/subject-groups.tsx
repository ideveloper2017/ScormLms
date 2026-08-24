import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Plus, Search, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import { curriculumApi } from "@/services/api/curriculum-api";
import { subjectGroupApi } from "@/services/api/subject-group-api";

const emptyForm = { curriculumSubjectId: 0, code: "", name: "", capacity: 30, active: true };

export function AdminSubjectGroups() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [curriculumId, setCurriculumId] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const curricula = useQuery({ queryKey: ["curricula", "subject-group-options"], queryFn: curriculumApi.list });
  const approved = useMemo(() => (curricula.data ?? []).filter((item) => item.status === "APPROVED"), [curricula.data]);
  const selectedCurriculum = approved.find((item) => item.id === curriculumId) ?? null;
  const groups = useQuery({
    queryKey: ["subject-groups", curriculumId],
    queryFn: () => subjectGroupApi.list(curriculumId ? { curriculumId } : {}),
  });
  const selectedGroup = groups.data?.find((item) => item.id === selectedGroupId) ?? null;
  const members = useQuery({
    queryKey: ["subject-groups", selectedGroupId, "members"],
    queryFn: () => subjectGroupApi.members(selectedGroupId!),
    enabled: !!selectedGroupId,
  });
  const candidates = useQuery({
    queryKey: ["subject-groups", selectedGroupId, "candidates", candidateSearch],
    queryFn: () => subjectGroupApi.candidates(selectedGroupId!, { search: candidateSearch.trim() || undefined, size: 20 }),
    enabled: !!selectedGroupId && !!selectedGroup?.active,
  });
  const assignedTeachers = useQuery({
    queryKey: ["subject-groups", selectedGroupId, "teachers"],
    queryFn: () => subjectGroupApi.teachers(selectedGroupId!),
    enabled: !!selectedGroupId,
  });
  const teacherCandidates = useQuery({
    queryKey: ["subject-groups", selectedGroupId, "teacher-candidates"],
    queryFn: () => subjectGroupApi.teacherCandidates(selectedGroupId!),
    enabled: !!selectedGroupId && !!selectedGroup?.active,
  });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["subject-groups"] });
  };
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const create = useMutation({
    mutationFn: () => subjectGroupApi.create(form),
    onSuccess: async (created) => {
      setSelectedGroupId(created.id);
      setForm(emptyForm);
      await refresh();
      toast({ title: "Fan oqimi yaratildi" });
    },
    onError: fail,
  });
  const assign = useMutation({
    mutationFn: (studentId: number) => subjectGroupApi.assign(selectedGroupId!, [studentId]),
    onSuccess: async () => { await refresh(); toast({ title: "Talaba fan guruhiga biriktirildi" }); },
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (studentId: number) => subjectGroupApi.removeStudent(selectedGroupId!, studentId),
    onSuccess: async () => { await refresh(); toast({ title: "Talaba fan guruhidan chiqarildi" }); },
    onError: fail,
  });
  const assignTeacher = useMutation({
    mutationFn: (teacherId: number) => subjectGroupApi.assignTeacher(selectedGroupId!, teacherId),
    onSuccess: async () => { await refresh(); toast({ title: "O'qituvchi fan guruhiga biriktirildi" }); },
    onError: fail,
  });
  const removeTeacher = useMutation({
    mutationFn: (teacherId: number) => subjectGroupApi.removeTeacher(selectedGroupId!, teacherId),
    onSuccess: async () => { await refresh(); toast({ title: "O'qituvchi fan guruhidan chiqarildi" }); },
    onError: fail,
  });

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Fan oqimlari</h1><p className="text-sm text-muted-foreground">Fan oqimi — tasdiqlangan o'quv reja fanini o'qitadigan o'qituvchi va talabalar tarkibi. U asosiy talabalar guruhidan alohida yuritiladi.</p></div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5" />Curriculum tanlash</CardTitle><CardDescription>Faqat tasdiqlangan o'quv rejalari operatsion fan guruhiga asos bo'ladi.</CardDescription></CardHeader><CardContent><select className="h-10 w-full max-w-xl rounded-md border bg-background px-3 text-sm" value={curriculumId} onChange={(event) => { setCurriculumId(Number(event.target.value)); setSelectedGroupId(null); setForm(emptyForm); }}><option value={0}>Barcha tasdiqlangan curriculumlar</option>{approved.map((item) => <option key={item.id} value={item.id}>{item.programName} · {item.versionCode} · {item.academicYear}</option>)}</select></CardContent></Card>

    {canWrite && selectedCurriculum && <Card><CardHeader><CardTitle>Yangi fan guruhi</CardTitle><CardDescription>Yil, semestr, dastur va fan tanlangan curriculum bandidan avtomatik olinadi.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2"><Label>Curriculum fani</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.curriculumSubjectId} onChange={(event) => setForm({ ...form, curriculumSubjectId: Number(event.target.value) })}><option value={0}>Fan tanlang</option>{selectedCurriculum.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.semester}-semestr · {subject.subjectCode} · {subject.subjectName}</option>)}</select></div>
      <div className="space-y-2"><Label>Guruh kodi</Label><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="DAST-A" /></div>
      <div className="space-y-2"><Label>Guruh nomi</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Dasturlash A guruhi" /></div>
      <div className="space-y-2"><Label>Sig'im</Label><Input type="number" min={1} max={500} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} /></div>
      <div className="flex items-end"><Button disabled={!form.curriculumSubjectId || form.code.trim().length < 2 || form.name.trim().length < 3 || form.capacity < 1 || create.isPending} onClick={() => create.mutate()}><Plus className="mr-2 h-4 w-4" />Fan oqimini yaratish</Button></div>
    </CardContent></Card>}

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Fan oqimlari</CardTitle><CardDescription>Mavjud asosiy guruhlar bu ro'yxatga avtomatik kiritilmaydi.</CardDescription></CardHeader><CardContent className="space-y-3">{(groups.data ?? []).map((group) => <button type="button" key={group.id} onClick={() => setSelectedGroupId(group.id)} className={`w-full rounded-md border p-3 text-left transition-colors ${selectedGroupId === group.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{group.code} · {group.name}</p><p className="text-sm text-muted-foreground">{group.programName} · {group.academicYear} · {group.semester}-semestr</p><p className="text-xs text-muted-foreground">{group.subjectCode} · {group.subjectName}</p></div><div className="flex flex-col items-end gap-1"><Badge variant={group.active ? "secondary" : "outline"}>{group.active ? "Faol" : "Nofaol"}</Badge><span className="text-xs">{group.memberCount}/{group.capacity}</span></div></div></button>)}{groups.data?.length === 0 && <p className="py-8 text-center text-muted-foreground">Fan oqimi hali yaratilmagan.</p>}</CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{selectedGroup ? `${selectedGroup.code} talabalari` : "Talabalarni biriktirish"}</CardTitle><CardDescription>{selectedGroup ? "Faqat shu dastur, o'quv yili va semestrdagi ACTIVE talabalar ko'rsatiladi." : "Boshqarish uchun chap tomondan fan guruhini tanlang."}</CardDescription></CardHeader>{selectedGroup && <CardContent className="space-y-5">
        <div><h3 className="mb-2 text-sm font-semibold">Biriktirilganlar</h3><div className="space-y-2">{(members.data ?? []).map((student) => <div key={student.studentId} className="flex items-center justify-between rounded-md border p-2"><div><p className="text-sm font-medium">{student.fullName}</p><p className="text-xs text-muted-foreground">{student.studentNumber}</p></div>{canWrite && <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(student.studentId)}><UserMinus className="mr-1 h-4 w-4" />Chiqarish</Button>}</div>)}{members.data?.length === 0 && <p className="text-sm text-muted-foreground">Talaba biriktirilmagan.</p>}</div></div>
        {selectedGroup.active && <div><h3 className="mb-2 text-sm font-semibold">Mos talabalar</h3><div className="relative mb-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} placeholder="F.I.Sh. yoki talaba raqami" /></div><div className="space-y-2">{(candidates.data?.items ?? []).map((student) => <div key={student.studentId} className="flex items-center justify-between rounded-md border p-2"><div><p className="text-sm font-medium">{student.fullName}</p><p className="text-xs text-muted-foreground">{student.studentNumber} · {student.semesterNumber}-semestr</p></div>{canWrite && <Button size="sm" variant="outline" disabled={assign.isPending || selectedGroup.memberCount >= selectedGroup.capacity} onClick={() => assign.mutate(student.studentId)}><UserPlus className="mr-1 h-4 w-4" />Biriktirish</Button>}</div>)}{candidates.data?.items.length === 0 && <p className="text-sm text-muted-foreground">Mos bo'sh talaba topilmadi.</p>}</div></div>}
        <div className="border-t pt-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><UserCheck className="h-4 w-4" />Biriktirilgan o'qituvchilar</h3><div className="space-y-2">{(assignedTeachers.data ?? []).map((teacher) => <div key={teacher.teacherId} className="flex items-center justify-between rounded-md border p-2"><div><p className="text-sm font-medium">{teacher.fullName}</p><p className="text-xs text-muted-foreground">{teacher.position ?? "Lavozim kiritilmagan"} · {teacher.departmentName ?? "Kafedra kiritilmagan"}</p></div>{canWrite && <Button size="sm" variant="ghost" disabled={removeTeacher.isPending} onClick={() => removeTeacher.mutate(teacher.teacherId)}><UserMinus className="mr-1 h-4 w-4" />Chiqarish</Button>}</div>)}{assignedTeachers.data?.length === 0 && <p className="text-sm text-muted-foreground">O'qituvchi biriktirilmagan.</p>}</div></div>
        {selectedGroup.active && canWrite && <div><h3 className="mb-2 text-sm font-semibold">Fan bo'yicha mos o'qituvchilar</h3><div className="space-y-2">{(teacherCandidates.data ?? []).map((teacher) => <div key={teacher.teacherId} className="flex items-center justify-between rounded-md border p-2"><div><p className="text-sm font-medium">{teacher.fullName}</p><p className="text-xs text-muted-foreground">{teacher.position ?? "Lavozim kiritilmagan"} · {teacher.departmentName ?? "Kafedra kiritilmagan"}</p></div><Button size="sm" variant="outline" disabled={assignTeacher.isPending} onClick={() => assignTeacher.mutate(teacher.teacherId)}><UserPlus className="mr-1 h-4 w-4" />Biriktirish</Button></div>)}{teacherCandidates.data?.length === 0 && <p className="text-sm text-muted-foreground">Mos bo'sh o'qituvchi topilmadi.</p>}</div></div>}
      </CardContent>}</Card>
    </div>
  </div>;
}
