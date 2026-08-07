import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, CheckCircle2, MapPin, Send, UserCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import { canRecordOrientationAttendance, orientationApi, type CreateOrientationInput, type OrientationAttendanceStatus } from "@/services/api/orientation-api";

const localDateTime = (offsetHours: number) => {
  const date = new Date(Date.now() + offsetHours * 3_600_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const currentAcademicYear = () => {
  const date = new Date();
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${year + 1}`;
};

export function AdminOrientations() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "LMS bilan boshlang'ich tanishtirish", venue: "", academicYear: currentAcademicYear(), startsAt: localDateTime(1), endsAt: localDateTime(3), instructions: "" });
  const sessions = useQuery({ queryKey: ["orientations"], queryFn: orientationApi.list });
  const attendees = useQuery({ queryKey: ["orientations", selectedId, "attendees"], queryFn: () => orientationApi.attendees(selectedId!), enabled: selectedId != null });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["orientations"] });
    if (selectedId) await client.invalidateQueries({ queryKey: ["orientations", selectedId, "attendees"] });
  };
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const create = useMutation({
    mutationFn: () => orientationApi.create({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() } as CreateOrientationInput),
    onSuccess: async (created) => { setSelectedId(created.id); setForm((value) => ({ ...value, venue: "", instructions: "" })); await refresh(); toast({ title: "Orientatsiya qoralamasi yaratildi" }); },
    onError: fail,
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: number; kind: "publish" | "complete" | "cancel" }) => orientationApi[kind](id),
    onSuccess: async () => { await refresh(); toast({ title: "Orientatsiya holati yangilandi" }); }, onError: fail,
  });
  const attendance = useMutation({
    mutationFn: ({ sessionId, studentId, status }: { sessionId: number; studentId: number; status: Exclude<OrientationAttendanceStatus, "INVITED"> }) => orientationApi.attendance(sessionId, studentId, status),
    onSuccess: async () => { await refresh(); toast({ title: "Davomat qayd etildi" }); }, onError: fail,
  });
  const selected = sessions.data?.find((item) => item.id === selectedId);

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">LMS orientatsiyasi</h1><p className="text-sm text-muted-foreground">559-son qaror 21-bandi: masofaviy talabaning shaxsan qatnashuvi va LMS yo'riqnomasini qabul qilishi.</p></div>
    {canWrite && <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck2 className="h-5 w-5" />Yangi orientatsiya</CardTitle><CardDescription>E'lon qilinganda mos faol masofaviy talabalar ro'yxati snapshot qilinadi.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2"><Label>Nomi</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
      <div className="space-y-2"><Label>O'tkazish joyi</Label><Input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} placeholder="Bino, xona" /></div>
      <div className="space-y-2"><Label>O'quv yili</Label><Input value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} /></div>
      <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>Boshlanish</Label><Input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></div><div className="space-y-2"><Label>Tugash</Label><Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></div></div>
      <div className="space-y-2 md:col-span-2"><Label>Yo'riqnoma</Label><Textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} placeholder="Kirish, kurslar, topshiriqlar, testlar va texnik yordam bo'yicha ko'rsatma" /></div>
      <Button className="md:col-span-2 md:w-fit" disabled={!form.title.trim() || !form.venue.trim() || create.isPending} onClick={() => create.mutate()}><CalendarCheck2 className="mr-2 h-4 w-4" />Qoralama yaratish</Button>
    </CardContent></Card>}

    <div className="grid gap-4 lg:grid-cols-2">{(sessions.data ?? []).map((session) => <Card key={session.id} className={selectedId === session.id ? "ring-2 ring-primary" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-lg">{session.title}</CardTitle><CardDescription><MapPin className="mr-1 inline h-3 w-3" />{session.venue} · {new Date(session.startsAt).toLocaleString("uz-Latn")}</CardDescription></div><Badge>{session.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm">{session.attendeeCount} talaba · {session.presentCount} qatnashgan · {session.acknowledgedCount} tasdiqlagan</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedId(session.id)}><UserCheck className="mr-1 h-3 w-3" />Ro'yxat</Button>{canWrite && session.status === "DRAFT" && <Button size="sm" onClick={() => action.mutate({ id: session.id, kind: "publish" })}><Send className="mr-1 h-3 w-3" />E'lon qilish</Button>}{canWrite && session.status === "PUBLISHED" && <Button size="sm" onClick={() => action.mutate({ id: session.id, kind: "complete" })}><CheckCircle2 className="mr-1 h-3 w-3" />Yakunlash</Button>}{canWrite && ["DRAFT", "PUBLISHED"].includes(session.status) && <Button size="sm" variant="destructive" onClick={() => action.mutate({ id: session.id, kind: "cancel" })}><XCircle className="mr-1 h-3 w-3" />Bekor qilish</Button>}</div></CardContent></Card>)}</div>

    {selected && <Card><CardHeader><CardTitle>{selected.title}: qatnashuv jurnali</CardTitle><CardDescription>{canRecordOrientationAttendance(selected) ? "Xodim shaxsan qatnashuvni qayd etadi; keyin talaba yo'riqnomani o'z kabinetida tasdiqlaydi." : "Davomat orientatsiya boshlanganidan keyin, PUBLISHED holatida qayd etiladi."}</CardDescription></CardHeader><CardContent className="space-y-2">{(attendees.data ?? []).map((attendee) => <div key={attendee.id} className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"><div><p className="font-medium">{attendee.studentName}</p><p className="text-xs text-muted-foreground">{attendee.studentNumber} · {attendee.attendanceStatus}{attendee.acknowledgementAt ? " · yo'riqnoma tasdiqlangan" : ""}</p></div>{canWrite && canRecordOrientationAttendance(selected) && <div className="flex flex-wrap gap-1"><Button size="sm" variant={attendee.attendanceStatus === "PRESENT" ? "default" : "outline"} onClick={() => attendance.mutate({ sessionId: selected.id, studentId: attendee.studentId, status: "PRESENT" })}>Qatnashdi</Button><Button size="sm" variant="outline" disabled={!!attendee.acknowledgementAt} onClick={() => attendance.mutate({ sessionId: selected.id, studentId: attendee.studentId, status: "ABSENT" })}>Kelmagan</Button><Button size="sm" variant="outline" disabled={!!attendee.acknowledgementAt} onClick={() => attendance.mutate({ sessionId: selected.id, studentId: attendee.studentId, status: "EXCUSED" })}>Sababli</Button></div>}</div>)}{attendees.data?.length === 0 && <p className="py-6 text-center text-muted-foreground">Talabalar ro'yxati hali shakllanmagan.</p>}</CardContent></Card>}
  </div>;
}

