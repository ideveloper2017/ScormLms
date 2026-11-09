import { useQuery } from '@tanstack/react-query';
import { Award, CalendarDays, MapPin, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QueryState } from '@/components/query-state';
import { qk } from '@/lib/query-keys';
import { attestationApi } from '@/services/api/attestation-api';
import { statusLabel } from "@/lib/status-labels";
import { formatDate } from '@/lib/format-date';

// 2026-11-09 -> 09.11.2026; vaqt bo'lsa 09:00:00 -> 09:00
const formatDateTime = (date?: string | null, time?: string | null) => time ? `${formatDate(date)}, ${time.slice(0, 5)}` : formatDate(date);

export function StudentAttestations() {
  const sessions = useQuery({ queryKey: qk.attestations.list(), queryFn: attestationApi.studentList });
  const certificates = useQuery({ queryKey: qk.attestations.certificates(), queryFn: attestationApi.studentCertificates });
  return <div className="p-3 sm:p-6 space-y-6"><div><h1 className="text-2xl font-bold">Davlat attestatsiyasi</h1><p className="text-muted-foreground">Himoya jadvali, komissiya qarori va bitiruv sertifikatingiz.</p></div>
    <QueryState isLoading={sessions.isLoading} isError={sessions.isError} error={sessions.error} onRetry={() => { void sessions.refetch(); }} isEmpty={!sessions.data?.length} emptyText="Sizga hali attestatsiya belgilanmagan.">
      <div className="grid md:grid-cols-2 gap-4">{(sessions.data ?? []).map(session => <Card key={session.id}><CardHeader><div className="flex justify-between gap-2"><div><CardTitle className="text-lg">{session.title}</CardTitle><CardDescription>{session.courseTitle} · Rais: {session.chairName}</CardDescription></div><Badge>{statusLabel(session.status)}</Badge></div></CardHeader><CardContent className="space-y-2 text-sm"><div><CalendarDays className="inline h-4 w-4 mr-2" />{formatDateTime(session.examDate, session.examTime)}</div><div><MapPin className="inline h-4 w-4 mr-2" />{session.location}</div>{!session.onsiteAttendanceRequired && <Badge variant="outline">Xorijiy fuqaro: shaxsan qatnashish talabi qo'llanmaydi</Badge>}<div>Himoya holati: <b>{session.myDefenseStatus ? statusLabel(session.myDefenseStatus) : 'Hali belgilanmagan'}</b></div>{session.resultPublished ? <div className="border-t pt-2">Komissiya qarori: <Badge variant={session.myDefenseDecision === 'PASS' ? 'default' : 'destructive'}>{statusLabel(session.myDefenseDecision)}</Badge>{session.myScore != null && <> · {session.myScore} ball</>}</div> : <p className="text-muted-foreground">Natija rasmiy yakunlashdan keyin ko'rsatiladi.</p>}</CardContent></Card>)}</div>
    </QueryState>
    <Card><CardHeader><CardTitle className="flex gap-2"><Award className="h-5 w-5" />Bitiruv sertifikatlari</CardTitle><CardDescription>Faqat tasdiqlangan davlat attestatsiyasi protokolidan keyin shakllanadi.</CardDescription></CardHeader><CardContent className="space-y-3">
      <QueryState isLoading={certificates.isLoading} isError={certificates.isError} error={certificates.error} onRetry={() => { void certificates.refetch(); }} isEmpty={!certificates.data?.length} emptyText="Sertifikat hali berilmagan.">
        {(certificates.data ?? []).map(certificate => <div key={certificate.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-2"><div><div className="font-semibold">{certificate.certificateNumber}</div><div className="text-sm text-muted-foreground">{certificate.programName} · {formatDate(certificate.issueDate)} · {certificate.defenseScore} ball</div></div><Badge variant="outline" className="gap-1 self-start"><ShieldCheck className="h-3 w-3" />Tekshiriladi</Badge></div>)}
      </QueryState>
    </CardContent></Card>
  </div>;
}
