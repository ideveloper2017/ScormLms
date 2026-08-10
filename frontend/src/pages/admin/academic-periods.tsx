import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, CheckCircle2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import { academicPeriodApi } from "@/services/api/academic-period-api";

export function AdminAcademicPeriods() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [yearCode, setYearCode] = useState("");
  const years = useQuery({ queryKey: ["academic-periods", "years", "all"], queryFn: () => academicPeriodApi.listYears(true) });
  const semesters = useQuery({ queryKey: ["academic-periods", "semesters", "all"], queryFn: () => academicPeriodApi.listSemesters(true) });
  useEffect(() => {
    if (yearCode || !years.data?.length) return;
    const next = Math.max(...years.data.map((year) => Number(year.code.slice(0, 4)))) + 1;
    setYearCode(`${next}-${next + 1}`);
  }, [yearCode, years.data]);
  const refresh = () => client.invalidateQueries({ queryKey: ["academic-periods"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const createYear = useMutation({
    mutationFn: () => academicPeriodApi.createYear({ code: yearCode, active: true, current: false }),
    onSuccess: async () => { await refresh(); toast({ title: "O'quv yili yaratildi" }); },
    onError: fail,
  });
  const updateYear = useMutation({
    mutationFn: ({ id, active, current }: { id: number; active: boolean; current: boolean }) => academicPeriodApi.updateYearState(id, { active, current }),
    onSuccess: async () => { await refresh(); toast({ title: "O'quv yili holati yangilandi" }); },
    onError: fail,
  });
  const updateSemester = useMutation({
    mutationFn: ({ id, nameUz, active }: { id: number; nameUz: string; active: boolean }) => academicPeriodApi.updateSemester(id, { nameUz, active }),
    onSuccess: async () => { await refresh(); toast({ title: "Semestr holati yangilandi" }); },
    onError: fail,
  });

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">O'quv yili va semestrlar</h1><p className="text-sm text-muted-foreground">Ta'lim jarayoni uchun boshqariladigan davr katalogi. Eski yozuvlar tarixiy snapshot sifatida o'zgarmaydi.</p></div>
    {canWrite && <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5" />Yangi o'quv yili</CardTitle><CardDescription>Kod ketma-ket YYYY-YYYY formatida; muddat 1-sentabrdan 31-avgustgacha avtomatik olinadi.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="space-y-2"><Label>O'quv yili kodi</Label><Input className="w-44" value={yearCode} onChange={(event) => setYearCode(event.target.value)} placeholder="2027-2028" /></div><Button disabled={!/^\d{4}-\d{4}$/.test(yearCode) || createYear.isPending} onClick={() => createYear.mutate()}><Plus className="mr-2 h-4 w-4" />Yaratish</Button></CardContent></Card>}
    <Card><CardHeader><CardTitle>O'quv yillari</CardTitle><CardDescription>Bir dona joriy yil belgilanadi. Joriy yil faolsizlantirilmaydi.</CardDescription></CardHeader><CardContent className="space-y-3">{(years.data ?? []).map((year) => <div key={year.id} className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center"><div><p className="font-medium">{year.code} {year.current && <CheckCircle2 className="ml-1 inline h-4 w-4 text-emerald-600" />}</p><p className="text-xs text-muted-foreground">{year.startsOn} — {year.endsOn}</p></div><div className="flex items-center gap-2"><Badge variant={year.active ? "secondary" : "outline"}>{year.active ? "Faol" : "Nofaol"}</Badge>{canWrite && !year.current && <><Button size="sm" variant="outline" onClick={() => updateYear.mutate({ id: year.id, active: true, current: true })}>Joriy qilish</Button><Button size="sm" variant="ghost" onClick={() => updateYear.mutate({ id: year.id, active: !year.active, current: false })}>{year.active ? "Faolsizlantirish" : "Faollashtirish"}</Button></>}</div></div>)}{years.data?.length === 0 && <p className="py-6 text-center text-muted-foreground">O'quv yili topilmadi.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Semestr ta'riflari</CardTitle><CardDescription>Semestr raqami va kurs bog'lanishi o'zgarmaydi; faqat ishlatilish holati boshqariladi.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{(semesters.data ?? []).map((semester) => <div key={semester.id} className="flex items-center justify-between rounded-md border p-3"><div><p className="font-medium">{semester.nameUz}</p><p className="text-xs text-muted-foreground">{semester.courseNumber}-kurs</p></div><div className="flex items-center gap-2"><Badge variant={semester.active ? "secondary" : "outline"}>{semester.active ? "Faol" : "Nofaol"}</Badge>{canWrite && <Button size="sm" variant="ghost" onClick={() => updateSemester.mutate({ id: semester.id, nameUz: semester.nameUz, active: !semester.active })}>{semester.active ? "O'chirish" : "Yoqish"}</Button>}</div></div>)}</CardContent></Card>
  </div>;
}
