import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, GraduationCap, MapPin, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/query-keys';
import { examApi } from '@/services/api/exam-api';

const statusLabel: Record<string, string> = { upcoming: 'Rejalashtirilgan', active: 'Davom etmoqda', completed: 'Yakunlangan' };
const attendanceLabel: Record<string, string> = { EXPECTED: 'Kutilmoqda', PRESENT: 'Qatnashdi', LATE: 'Kechikdi', ABSENT: 'Qatnashmadi', EXCUSED: 'Sababli' };

export function Exams() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [appealResultId, setAppealResultId] = useState('');
  const [reason, setReason] = useState('');
  const exams = useQuery({ queryKey: qk.exams.list(), queryFn: examApi.getExams });
  const results = useQuery({ queryKey: qk.exams.results(), queryFn: examApi.getResults });
  const stats = useQuery({ queryKey: qk.exams.stats(), queryFn: examApi.getStats });
  const appeals = useQuery({ queryKey: qk.exams.appeals(), queryFn: examApi.getAppeals });
  const createAppeal = useMutation({
    mutationFn: () => examApi.createAppeal(appealResultId, reason.trim()),
    onSuccess: async () => { setAppealResultId(''); setReason(''); await queryClient.invalidateQueries({ queryKey: qk.exams.appeals() }); toast({ title: 'Apellyatsiya yuborildi' }); },
    onError: (error: Error) => toast({ variant: 'destructive', title: 'Apellyatsiya yuborilmadi', description: error.message }),
  });
  if (exams.isLoading || results.isLoading) return <div className="p-6"><Card><CardContent className="py-12 text-center text-muted-foreground">Yuklanmoqda...</CardContent></Card></div>;
  if (exams.error || results.error) return <div className="p-6"><Card className="border-destructive"><CardContent className="py-10 text-center space-y-3"><AlertTriangle className="h-10 w-10 mx-auto text-destructive" /><p>Imtihon ma'lumotlari yuklanmadi</p><Button variant="outline" onClick={() => { exams.refetch(); results.refetch(); }}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button></CardContent></Card></div>;
  return <div className="p-3 sm:p-6 space-y-6">
    <div><h1 className="text-2xl font-bold">Yakuniy nazoratlar</h1><p className="text-muted-foreground">Auditoriya, sana, vaqt, davomat va e'lon qilingan natijalarni ko'ring.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[['Jami', stats.data?.total ?? 0], ['Kutilayotgan', stats.data?.upcoming ?? 0], ['Yakunlangan', stats.data?.completed ?? 0], ["O'rtacha", `${(stats.data?.avgScore ?? 0).toFixed(1)}%`]].map(([label, value]) => <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>)}
    </div>
    <div className="grid md:grid-cols-2 gap-4">{(exams.data ?? []).map(exam => <Card key={exam.id}><CardHeader><div className="flex justify-between gap-2"><div><CardTitle className="text-lg">{exam.title}</CardTitle><CardDescription>{exam.course}</CardDescription></div><Badge variant={exam.status === 'active' ? 'default' : 'outline'}>{statusLabel[exam.status] ?? exam.status}</Badge></div></CardHeader><CardContent className="space-y-2 text-sm"><div><CalendarDays className="inline h-4 w-4 mr-2" />{exam.date} {exam.time}</div><div><MapPin className="inline h-4 w-4 mr-2" />{exam.location}</div><div><Clock className="inline h-4 w-4 mr-2" />{exam.duration} daqiqa · {exam.type}</div><div className="pt-2"><Badge variant="secondary">Davomat: {attendanceLabel[exam.attendanceStatus ?? 'EXPECTED'] ?? exam.attendanceStatus}</Badge></div></CardContent></Card>)}{exams.data?.length === 0 && <Card className="md:col-span-2"><CardContent className="py-12 text-center text-muted-foreground">E'lon qilingan yakuniy nazorat mavjud emas.</CardContent></Card>}</div>
    <Card><CardHeader><CardTitle>Natijalar</CardTitle><CardDescription>Natija faqat sessiya yakunlangandan keyin e'lon qilinadi.</CardDescription></CardHeader><CardContent className="space-y-3">{(results.data ?? []).map(result => { const hasAppeal = appeals.data?.some(item => item.examResultId === result.id); return <div key={result.id} className="border rounded-lg p-4 space-y-3"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><div className="font-semibold">{result.examTitle}</div><div className="text-sm text-muted-foreground">{result.course} · {result.date} · Davomat: {attendanceLabel[result.attendanceStatus ?? ''] ?? result.attendanceStatus}</div></div><div className="flex items-center gap-2"><Badge variant={result.passed ? 'default' : 'destructive'}>{result.score}/{result.maxScore} · {result.grade ?? ''}</Badge>{result.passed && <CheckCircle2 className="h-5 w-5 text-green-600" />}</div></div>{hasAppeal ? <div className="text-sm text-muted-foreground">Apellyatsiya holati: {appeals.data?.find(item => item.examResultId === result.id)?.status}</div> : appealResultId === result.id ? <div className="space-y-2"><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Apellyatsiya sababini kamida 10 belgi bilan yozing" /><div className="flex gap-2"><Button size="sm" disabled={reason.trim().length < 10 || createAppeal.isPending} onClick={() => createAppeal.mutate()}>Yuborish</Button><Button size="sm" variant="outline" onClick={() => { setAppealResultId(''); setReason(''); }}>Bekor qilish</Button></div></div> : <Button size="sm" variant="outline" onClick={() => setAppealResultId(result.id)}>Apellyatsiya berish</Button>}</div>; })}{results.data?.length === 0 && <div className="py-8 text-center text-muted-foreground"><GraduationCap className="h-8 w-8 mx-auto mb-2" />E'lon qilingan natija yo'q.</div>}</CardContent></Card>
  </div>;
}
