import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, CheckCircle2, FileCheck2, Play, Plus, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/query-keys';
import { attestationApi } from '@/services/api/attestation-api';
import { teacherPortalApi } from '@/services/api/teacher-portal-api';
import { hasAuthority } from '@/lib/rbac-api';
import { statusLabel } from "@/lib/status-labels";
import { listTeachers } from '@/lib/teacher-api';
import { useConfirm } from '@/components/confirm-dialog';
import { QueryState } from '@/components/query-state';

const today = new Date().toISOString().slice(0, 10);
const commissionRoleLabel: Record<string, string> = { CHAIR: 'Rais', MEMBER: "A'zo", SECRETARY: 'Kotib' };

export function TeacherAttestations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirm();
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'BACHELOR' | 'MASTER'>('BACHELOR');
  const [memberId, setMemberId] = useState('');
  const [memberRole, setMemberRole] = useState<'MEMBER' | 'SECRETARY'>('MEMBER');
  const [scores, setScores] = useState<Record<string, string>>({});
  const sessions = useQuery({ queryKey: qk.teacher.attestations(), queryFn: attestationApi.teacherList });
  const courses = useQuery({ queryKey: qk.teacher.courses(), queryFn: teacherPortalApi.getCourses });
  const detail = useQuery({ queryKey: qk.teacher.attestation(selectedId), queryFn: () => attestationApi.detail(selectedId), enabled: Boolean(selectedId) });
  const protocol = useQuery({ queryKey: qk.teacher.attestationProtocol(selectedId), queryFn: () => attestationApi.getProtocol(selectedId), enabled: Boolean(selectedId) });
  const teachers = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => listTeachers(), enabled: Boolean(selectedId), staleTime: 300_000 });
  const refresh = async () => { await client.invalidateQueries({ queryKey: qk.teacher.attestations() }); if (selectedId) { await client.invalidateQueries({ queryKey: qk.teacher.attestation(selectedId) }); await client.invalidateQueries({ queryKey: qk.teacher.attestationProtocol(selectedId) }); } };
  const fail = (error: Error) => toast({ variant: 'destructive', title: 'Amal bajarilmadi', description: error.message });
  const create = useMutation({ mutationFn: () => attestationApi.create({ courseId: Number(courseId), title: title.trim(), description: description.trim() || undefined, examDate: date, examTime: time, location: location.trim(), commissionChairId: Number(user?.id), defenseType: type, minCommissionMembers: 3, minPassScore: 60 }), onSuccess: async () => { setTitle(''); setDescription(''); setLocation(''); await refresh(); toast({ title: 'Attestatsiya sessiyasi yaratildi' }); }, onError: fail });
  const action = useMutation({ mutationFn: async ({ id, kind }: { id: string; kind: 'publish' | 'start' | 'complete' | 'remove' }) => { if (kind === 'remove') await attestationApi.remove(id); else await attestationApi[kind](id); }, onSuccess: refresh, onError: fail });
  const addMember = useMutation({ mutationFn: () => attestationApi.addMember(selectedId, Number(memberId), memberRole), onSuccess: async () => { setMemberId(''); await refresh(); toast({ title: "Komissiya a'zosi qo'shildi" }); }, onError: fail });
  const record = useMutation({ mutationFn: attestationApi.recordDefense, onSuccess: refresh, onError: fail });
  const grade = useMutation({ mutationFn: ({ defenseId, score }: { defenseId: string; score: number }) => attestationApi.grade(defenseId, score), onSuccess: refresh, onError: fail });
  const generateProtocol = useMutation({ mutationFn: () => attestationApi.generateProtocol(selectedId), onSuccess: refresh, onError: fail });
  const approve = useMutation({ mutationFn: attestationApi.approveProtocol, onSuccess: refresh, onError: fail });
  const certificate = useMutation({ mutationFn: (defenseId: string) => attestationApi.generateCertificate(defenseId, Number(user?.id)), onSuccess: refresh, onError: fail });
  const removeSession = async (id: string, sessionTitle: string) => {
    if (await confirm({ title: "Sessiya o'chirilsinmi?", description: `"${sessionTitle}" qoralamasi o'chiriladi. Bu amalni qaytarib bo'lmaydi.`, confirmLabel: "Ha, o'chirish" })) action.mutate({ id, kind: 'remove' });
  };
  const selected = sessions.data?.find(item => item.id === selectedId);
  const canApprove = hasAuthority(user, 'ACADEMIC_WRITE');
  // Komissiyaga akkaunti bor, faol va hali qo'shilmagan o'qituvchilar tanlanadi
  const memberUserIds = new Set((detail.data?.commission.members ?? []).map(member => String(member.userId)));
  const memberCandidates = (teachers.data ?? []).filter(teacher => teacher.active && teacher.userId != null && !memberUserIds.has(String(teacher.userId)));

  return <div className="p-3 sm:p-6 space-y-6">
    <div><h1 className="text-2xl font-bold">Davlat attestatsiyasi</h1><p className="text-muted-foreground">Komissiya, himoya qaydnomasi, rasmiy protokol va bitiruv sertifikatlarini boshqaring.</p></div>
    <Card><CardHeader><CardTitle className="text-base flex gap-2"><Plus className="h-4 w-4" />Yangi sessiya</CardTitle><CardDescription>Joriy foydalanuvchi komissiya raisi sifatida serverda avtomatik biriktiriladi.</CardDescription></CardHeader><CardContent className="grid md:grid-cols-3 gap-3">
      <Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Kurs" /></SelectTrigger><SelectContent>{(courses.data ?? []).filter(c => c.status !== 'archived').map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select>
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Attestatsiya nomi" /><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Joy" />
      <Input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} /><Input type="time" value={time} onChange={e => setTime(e.target.value)} /><Select value={type} onValueChange={value => setType(value as typeof type)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BACHELOR">Bakalavr</SelectItem><SelectItem value="MASTER">Magistr</SelectItem></SelectContent></Select>
      <Textarea className="md:col-span-2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tavsif" /><Button disabled={!user?.id || !courseId || !title.trim() || !location.trim()} onClick={() => create.mutate()}><Plus className="h-4 w-4 mr-2" />Yaratish</Button>
    </CardContent></Card>
    {sessions.isLoading && (
      <div className="grid lg:grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 space-y-3">
              <div className="h-6 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="flex gap-2"><div className="h-8 bg-muted rounded w-24"></div></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
    {sessions.isError && <QueryState isError error={sessions.error} onRetry={() => { void sessions.refetch(); }} />}
    {!sessions.isLoading && sessions.data?.length === 0 && (
      <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <FileCheck2 className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="font-semibold text-lg text-foreground">Attestatsiyalar yo'q</h3>
        <p>Hozircha birorta ham davlat attestatsiyasi ochilmagan.</p>
      </Card>
    )}
    {!sessions.isLoading && (sessions.data ?? []).length > 0 && (
      <div className="grid lg:grid-cols-2 gap-3">
        {(sessions.data ?? []).map(session => <Card key={session.id} className={selectedId === session.id ? 'border-primary' : ''}><CardContent className="p-4 space-y-3"><div className="flex justify-between"><div><div className="font-semibold">{session.title}</div><div className="text-sm text-muted-foreground">{session.courseTitle} · {session.examDate} {session.examTime} · {session.location}</div></div><Badge>{statusLabel(session.status)}</Badge></div><div className="text-sm">Komissiya: {session.currentMemberCount}/{session.minCommissionMembers} · Himoya: {session.defenseCount}/{session.totalEnrolled} · O'tdi: {session.passedCount}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedId(session.id)}>Qaydnomani ochish</Button>{session.status === 'DRAFT' && <><Button size="sm" onClick={() => action.mutate({ id: session.id, kind: 'publish' })}>E'lon qilish</Button><Button size="icon" variant="ghost" aria-label={`${session.title}: sessiyani o'chirish`} onClick={() => { void removeSession(session.id, session.title); }}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button></>}{session.status === 'PUBLISHED' && <Button size="sm" onClick={() => action.mutate({ id: session.id, kind: 'start' })}><Play className="h-4 w-4 mr-1" />Boshlash</Button>}{session.status === 'ONGOING' && <Button size="sm" onClick={() => action.mutate({ id: session.id, kind: 'complete' })}><CheckCircle2 className="h-4 w-4 mr-1" />Yakunlash</Button>}</div></CardContent></Card>)}
      </div>
    )}
    {selected && <Card><CardHeader><CardTitle>{selected.title}: komissiya va himoyalar</CardTitle></CardHeader><CardContent className="space-y-4">{selected.status === 'DRAFT' && <div className="flex flex-col sm:flex-row gap-2"><Select value={memberId} onValueChange={setMemberId} disabled={teachers.isLoading || teachers.isError}><SelectTrigger aria-label="Komissiya a'zosi"><SelectValue placeholder={teachers.isLoading ? 'Yuklanmoqda...' : "O'qituvchini tanlang"} /></SelectTrigger><SelectContent>{memberCandidates.map(teacher => <SelectItem key={teacher.id} value={String(teacher.userId)}>{teacher.fullName}{teacher.departmentName ? ` · ${teacher.departmentName}` : ''}</SelectItem>)}{memberCandidates.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">Qo'shish mumkin bo'lgan o'qituvchi topilmadi</p>}</SelectContent></Select><Select value={memberRole} onValueChange={value => setMemberRole(value as typeof memberRole)}><SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEMBER">A'zo</SelectItem><SelectItem value="SECRETARY">Kotib</SelectItem></SelectContent></Select><Button disabled={!memberId || addMember.isPending} onClick={() => addMember.mutate()}><UserPlus className="h-4 w-4 mr-1" />Qo'shish</Button></div>}
      {selected.status === 'DRAFT' && teachers.isError && <p className="text-sm text-destructive">O'qituvchilar ro'yxatini yuklab bo'lmadi. <Button size="sm" variant="outline" className="ml-2" onClick={() => { void teachers.refetch(); }}>Qayta urinish</Button></p>}
      <QueryState isLoading={detail.isLoading} isError={detail.isError} error={detail.error} onRetry={() => { void detail.refetch(); }}>
      <div className="flex flex-wrap gap-2">{detail.data?.commission.members.map(member => <Badge key={member.id} variant="outline">{member.userName} · {commissionRoleLabel[member.role] ?? member.role}</Badge>)}</div>
      {detail.data?.defenseList.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Himoya qiladigan talabalar ro'yxati hali shakllanmagan.</p>}
      {(detail.data?.defenseList ?? []).map(defense => <div key={defense.defenseId} className="border rounded-lg p-3 grid md:grid-cols-[1fr_auto_auto] gap-2 items-center"><div><div className="font-medium">{defense.studentName} {!defense.onsiteAttendanceRequired && <Badge variant="outline" className="ml-2">Xorijiy fuqaro — istisno</Badge>}</div><div className="text-xs text-muted-foreground">{statusLabel(defense.defenseStatus)} · {defense.commissionDecision ? statusLabel(defense.commissionDecision) : 'qaror kutilmoqda'} · {defense.averageScore ?? 0} ball{defense.onsiteAttendanceRequired && defense.onsiteAttendanceConfirmedAt ? ' · shaxsan qatnashuv tasdiqlangan' : ''}</div></div><Button size="sm" variant="outline" disabled={selected.status !== 'ONGOING' || defense.defenseStatus === 'DEFENDED'} onClick={() => record.mutate({ id: defense.defenseId, onsiteAttendanceConfirmed: defense.onsiteAttendanceRequired })}>{defense.onsiteAttendanceRequired ? 'Shaxsan himoya tasdiqlandi' : 'Himoya yakunlandi'}</Button><div className="flex gap-1"><Input className="w-24" type="number" min="0" max="100" value={scores[defense.defenseId] ?? ''} onChange={e => setScores(old => ({ ...old, [defense.defenseId]: e.target.value }))} placeholder="Ball" /><Button size="sm" disabled={selected.status !== 'ONGOING' || defense.defenseStatus !== 'DEFENDED' || !scores[defense.defenseId]} onClick={() => grade.mutate({ defenseId: defense.defenseId, score: Number(scores[defense.defenseId]) })}>Baholash</Button>{protocol.data?.approved && defense.commissionDecision === 'PASS' && !defense.certificateIssued && <Button size="sm" aria-label={`${defense.studentName}: bitiruv sertifikatini yaratish`} title="Bitiruv sertifikatini yaratish" onClick={() => certificate.mutate(defense.defenseId)}><Award className="h-4 w-4" aria-hidden="true" /></Button>}</div></div>)}
      </QueryState>
      {selected.status === 'COMPLETED' && <div className="border-t pt-4 flex flex-wrap items-center gap-2">{protocol.data ? <><Badge variant={protocol.data.approved ? 'default' : 'secondary'}>{protocol.data.protocolNumber} · {protocol.data.approved ? 'tasdiqlangan' : 'tasdiq kutilmoqda'}</Badge>{!protocol.data.approved && canApprove && <Button size="sm" onClick={() => approve.mutate(protocol.data!.id)}><FileCheck2 className="h-4 w-4 mr-1" />Tasdiqlash</Button>}</> : <Button onClick={() => generateProtocol.mutate()}>Rasmiy protokol yaratish</Button>}</div>}
    </CardContent></Card>}
    {confirmDialog}
  </div>;
}
