import { useQuery } from '@tanstack/react-query';
import { Award, CalendarDays, MapPin, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { qk } from '@/lib/query-keys';
import { attestationApi } from '@/services/api/attestation-api';

export function StudentAttestations() {
  const sessions = useQuery({ queryKey: qk.attestations.list(), queryFn: attestationApi.studentList });
  const certificates = useQuery({ queryKey: qk.attestations.certificates(), queryFn: attestationApi.studentCertificates });
  return <div className="p-3 sm:p-6 space-y-6"><div><h1 className="text-2xl font-bold">Davlat attestatsiyasi</h1><p className="text-muted-foreground">Himoya jadvali, komissiya qarori va bitiruv sertifikatingiz.</p></div>
    <div className="grid md:grid-cols-2 gap-4">{(sessions.data ?? []).map(session => <Card key={session.id}><CardHeader><div className="flex justify-between gap-2"><div><CardTitle className="text-lg">{session.title}</CardTitle><CardDescription>{session.courseTitle} · Rais: {session.chairName}</CardDescription></div><Badge>{session.status}</Badge></div></CardHeader><CardContent className="space-y-2 text-sm"><div><CalendarDays className="inline h-4 w-4 mr-2" />{session.examDate} {session.examTime}</div><div><MapPin className="inline h-4 w-4 mr-2" />{session.location}</div><div>Himoya holati: <b>{session.myDefenseStatus}</b></div>{session.resultPublished ? <div className="border-t pt-2">Komissiya qarori: <Badge variant={session.myDefenseDecision === 'PASS' ? 'default' : 'destructive'}>{session.myDefenseDecision}</Badge> · {session.myScore} ball</div> : <p className="text-muted-foreground">Natija rasmiy yakunlashdan keyin ko'rsatiladi.</p>}</CardContent></Card>)}{sessions.data?.length === 0 && <Card className="md:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Attestatsiya sessiyasi mavjud emas.</CardContent></Card>}</div>
    <Card><CardHeader><CardTitle className="flex gap-2"><Award className="h-5 w-5" />Bitiruv sertifikatlari</CardTitle><CardDescription>Faqat tasdiqlangan davlat attestatsiyasi protokolidan keyin shakllanadi.</CardDescription></CardHeader><CardContent className="space-y-3">{(certificates.data ?? []).map(certificate => <div key={certificate.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-2"><div><div className="font-semibold">{certificate.certificateNumber}</div><div className="text-sm text-muted-foreground">{certificate.programName} · {certificate.issueDate} · {certificate.defenseScore} ball</div></div><Badge variant="outline" className="gap-1 self-start"><ShieldCheck className="h-3 w-3" />Tekshiriladi</Badge></div>)}{certificates.data?.length === 0 && <p className="py-6 text-center text-muted-foreground">Sertifikat hali berilmagan.</p>}</CardContent></Card>
  </div>;
}
