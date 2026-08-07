import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CheckCircle2, ClipboardCheck, Play, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/query-keys';
import { teacherPortalApi } from '@/services/api/teacher-portal-api';
import { teacherExamApi, type ExamAttendanceStatus, type ExamAppeal } from '@/services/api/teacher-exam-api';

const today = new Date().toISOString().slice(0, 10);
const statusLabel: Record<string, string> = { DRAFT: 'Draft', PUBLISHED: "E'lon qilingan", ONGOING: 'Davom etmoqda', COMPLETED: 'Yakunlangan' };

function AppealReview({ appeal, onReview }: { appeal: ExamAppeal; onReview: (status: 'APPROVED' | 'PARTIAL' | 'REJECTED', decision: string, score?: number) => void }) {
  const [decision, setDecision] = useState('Natija qayta ko‘rib chiqildi');
  const [score, setScore] = useState('');
  return <div className="border rounded-lg p-3 space-y-2">
    <div className="font-medium">{appeal.studentName} <Badge variant="outline">{appeal.status}</Badge></div>
    <p className="text-sm text-muted-foreground">{appeal.reason}</p>
    {appeal.status === 'PENDING' && <div className="flex flex-col sm:flex-row gap-2">
      <Input value={decision} onChange={event => setDecision(event.target.value)} placeholder="Qaror izohi" />
      <Input className="sm:w-28" type="number" min="0" max="100" value={score} onChange={event => setScore(event.target.value)} placeholder="Yangi ball" />
      <Button size="sm" disabled={!decision.trim() || !score} onClick={() => onReview('APPROVED', decision, Number(score))}>Tasdiqlash</Button>
      <Button size="sm" variant="destructive" disabled={!decision.trim()} onClick={() => onReview('REJECTED', decision)}>Rad etish</Button>
    </div>}
  </div>;
}

export function TeacherExams() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState(today);
  const [examTime, setExamTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [examType, setExamType] = useState<'WRITTEN' | 'ORAL' | 'PRACTICAL' | 'HYBRID'>('WRITTEN');
  const [duration, setDuration] = useState('120');
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, ExamAttendanceStatus>>({});
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});

  const sessions = useQuery({ queryKey: qk.teacher.exams(), queryFn: teacherExamApi.list });
  const courses = useQuery({ queryKey: qk.teacher.courses(), queryFn: teacherPortalApi.getCourses });
  const attendance = useQuery({ queryKey: qk.teacher.examAttendance(selectedId), queryFn: () => teacherExamApi.attendance(selectedId), enabled: Boolean(selectedId) });
  const results = useQuery({ queryKey: qk.teacher.examResults(selectedId), queryFn: () => teacherExamApi.results(selectedId), enabled: Boolean(selectedId) });
  const appeals = useQuery({ queryKey: qk.teacher.examAppeals(selectedId), queryFn: () => teacherExamApi.appeals(selectedId), enabled: Boolean(selectedId) });
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: qk.teacher.exams() }); if (selectedId) await Promise.all([
    queryClient.invalidateQueries({ queryKey: qk.teacher.examAttendance(selectedId) }),
    queryClient.invalidateQueries({ queryKey: qk.teacher.examResults(selectedId) }),
    queryClient.invalidateQueries({ queryKey: qk.teacher.examAppeals(selectedId) }),
  ]); };
  const notifyError = (error: Error) => toast({ variant: 'destructive', title: 'Amal bajarilmadi', description: error.message });
  const action = useMutation({ mutationFn: async ({ id, kind }: { id: string; kind: 'publish' | 'start' | 'complete' | 'remove' }) => { if (kind === 'remove') await teacherExamApi.remove(id); else await teacherExamApi[kind](id); }, onSuccess: refresh, onError: notifyError });
  const create = useMutation({
    mutationFn: () => teacherExamApi.create({ courseId: Number(courseId), title: title.trim(), description: description.trim() || undefined, examDate, examTime, location: location.trim(), examType, durationMinutes: Number(duration) }),
    onSuccess: async () => { setTitle(''); setDescription(''); setLocation(''); await refresh(); toast({ title: 'Yakuniy nazorat sessiyasi yaratildi' }); }, onError: notifyError,
  });
  const mark = useMutation({ mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: ExamAttendanceStatus }) => teacherExamApi.recordAttendance(selectedId, enrollmentId, status), onSuccess: refresh, onError: notifyError });
  const grade = useMutation({ mutationFn: ({ enrollmentId, score }: { enrollmentId: string; score: number }) => teacherExamApi.recordResult(selectedId, enrollmentId, score), onSuccess: refresh, onError: notifyError });
  const review = useMutation({ mutationFn: ({ appealId, status, decision, score }: { appealId: string; status: 'APPROVED' | 'PARTIAL' | 'REJECTED'; decision: string; score?: number }) => teacherExamApi.reviewAppeal(appealId, status, decision, score), onSuccess: refresh, onError: notifyError });

  if (sessions.error) return <div className="p-6"><Card className="border-destructive"><CardContent className="py-8 text-center"><p>{sessions.error.message}</p><Button variant="outline" onClick={() => sessions.refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button></CardContent></Card></div>;
  const selected = sessions.data?.find(item => item.id === selectedId);
  const resultByEnrollment = new Map((results.data ?? []).map(item => [item.enrollmentId, item]));
  return <div className="p-3 sm:p-6 space-y-6">
    <div><h1 className="text-2xl font-bold">Yakuniy nazorat</h1><p className="text-muted-foreground">Auditoriya, vaqt, tasdiqlangan davomat, baho va apellyatsiyani bitta oqimda boshqaring.</p></div>
    <Card><CardHeader><CardTitle className="text-base flex gap-2"><Plus className="h-4 w-4" />Yangi sessiya</CardTitle><CardDescription>Sessiya e'lon qilinganda kursdagi talabalar ro'yxati avtomatik muzlatiladi.</CardDescription></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Kurs" /></SelectTrigger><SelectContent>{(courses.data ?? []).filter(c => c.status !== 'archived').map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select>
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nazorat nomi" /><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bino va auditoriya" />
      <Input type="date" min={today} value={examDate} onChange={e => setExamDate(e.target.value)} /><Input type="time" value={examTime} onChange={e => setExamTime(e.target.value)} /><Input type="number" min="1" max="480" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Daqiqa" />
      <Select value={examType} onValueChange={value => setExamType(value as typeof examType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="WRITTEN">Yozma</SelectItem><SelectItem value="ORAL">Og'zaki</SelectItem><SelectItem value="PRACTICAL">Amaliy</SelectItem><SelectItem value="HYBRID">Aralash</SelectItem></SelectContent></Select>
      <Textarea className="md:col-span-2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ko'rsatmalar" />
      <Button disabled={!courseId || !title.trim() || !location.trim() || !examDate || !examTime || create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4 mr-2" />Yaratish</Button>
    </CardContent></Card>
    <div className="grid lg:grid-cols-2 gap-4">{(sessions.data ?? []).map(session => <Card key={session.id} className={selectedId === session.id ? 'border-primary' : ''}><CardContent className="p-4 space-y-3">
      <div className="flex justify-between gap-3"><div><div className="font-semibold">{session.title}</div><div className="text-sm text-muted-foreground">{session.courseTitle} · {session.examDate} {session.examTime} · {session.location}</div></div><Badge>{statusLabel[session.status]}</Badge></div>
      <div className="flex gap-3 text-sm"><span><Users className="inline h-4 w-4" /> {session.registeredCount}</span><span className="text-green-600">Kelgan: {session.presentCount}</span><span className="text-red-600">Kelmagan: {session.absentCount}</span></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedId(session.id)}><ClipboardCheck className="h-4 w-4 mr-1" />Ro'yxat</Button>{session.status === 'DRAFT' && <><Button size="sm" onClick={() => action.mutate({ id: session.id, kind: 'publish' })}><CalendarCheck className="h-4 w-4 mr-1" />E'lon qilish</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => action.mutate({ id: session.id, kind: 'remove' })}><Trash2 className="h-4 w-4" /></Button></>}{session.status === 'PUBLISHED' && <Button size="sm" onClick={() => action.mutate({ id: session.id, kind: 'start' })}><Play className="h-4 w-4 mr-1" />Boshlash</Button>}{session.status === 'ONGOING' && <Button size="sm" onClick={() => action.mutate({ id: session.id, kind: 'complete' })}><CheckCircle2 className="h-4 w-4 mr-1" />Yakunlash</Button>}</div>
    </CardContent></Card>)}</div>
    {selected && <Card><CardHeader><CardTitle>{selected.title}: auditoriya qaydnomasi</CardTitle><CardDescription>Kelganlikni vakolatli xodim tasdiqlaydi; xorijiy fuqaro uchun 21-banddagi shaxsan qatnashish talabi qo'llanmaydi.</CardDescription></CardHeader><CardContent className="space-y-3">{(attendance.data?.attendanceRecords ?? []).map(record => {
      const saved = resultByEnrollment.get(record.enrollmentId);
      const mayGrade = !record.onsiteAttendanceRequired || ['PRESENT', 'LATE'].includes(record.status);
      return <div key={record.id} className="border rounded-lg p-3 grid md:grid-cols-[1fr_180px_120px_120px] gap-2 items-center"><div><div className="font-medium">{record.studentName} {!record.onsiteAttendanceRequired && <Badge variant="outline" className="ml-2">Xorijiy fuqaro — istisno</Badge>}</div><div className="text-xs text-muted-foreground">{record.studentEmail} · {record.onsiteAttendanceRequired ? (record.verificationTime ? `Tasdiqlagan: ${record.verifiedBy}` : 'Tasdiqlanmagan') : 'Shaxsan davomat majburiy emas'}</div></div><Select value={attendanceDraft[record.enrollmentId] ?? record.status} onValueChange={value => setAttendanceDraft(old => ({ ...old, [record.enrollmentId]: value as ExamAttendanceStatus }))} disabled={selected.status !== 'ONGOING'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PRESENT">Qatnashdi</SelectItem><SelectItem value="LATE">Kechikdi</SelectItem><SelectItem value="ABSENT">Qatnashmadi</SelectItem><SelectItem value="EXCUSED">Sababli</SelectItem></SelectContent></Select><Button size="sm" variant="outline" disabled={selected.status !== 'ONGOING'} onClick={() => mark.mutate({ enrollmentId: record.enrollmentId, status: attendanceDraft[record.enrollmentId] ?? record.status })}>Tasdiqlash</Button><div className="flex gap-1"><Input type="number" min="0" max="100" value={scoreDraft[record.enrollmentId] ?? saved?.score ?? ''} onChange={e => setScoreDraft(old => ({ ...old, [record.enrollmentId]: e.target.value }))} placeholder="Ball" disabled={selected.status !== 'ONGOING' || !mayGrade} /><Button size="sm" disabled={selected.status !== 'ONGOING' || !mayGrade || !scoreDraft[record.enrollmentId]} onClick={() => grade.mutate({ enrollmentId: record.enrollmentId, score: Number(scoreDraft[record.enrollmentId]) })}>{saved?.grade ?? 'Saqlash'}</Button></div></div>;
    })}{attendance.data?.attendanceRecords.length === 0 && <p className="text-center text-muted-foreground py-5">Ro'yxat sessiya e'lon qilinganda yaratiladi.</p>}</CardContent></Card>}
    {selected && (appeals.data ?? []).length > 0 && <Card><CardHeader><CardTitle>Apellyatsiyalar</CardTitle></CardHeader><CardContent className="space-y-3">{appeals.data?.map(appeal => <AppealReview key={appeal.id} appeal={appeal} onReview={(status, decision, score) => review.mutate({ appealId: appeal.id, status, decision, score })} />)}</CardContent></Card>}
  </div>;
}
