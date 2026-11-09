import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryState } from "@/components/query-state";
import { assessmentLeaveApi, type AssessmentLeavePurpose } from "@/services/api/assessment-leave-api";
import { statusLabel } from "@/lib/status-labels";
import { formatDate } from "@/lib/format-date";

const purposeLabel: Record<AssessmentLeavePurpose, string> = { SEMESTER_FINAL_ASSESSMENT: "Semestr yakuniy baholashi", STATE_ATTESTATION: "Davlat attestatsiyasi", BACHELOR_THESIS_DEFENSE: "Bitiruv malakaviy ishi himoyasi", MASTER_THESIS_DEFENSE: "Magistrlik ishi himoyasi" };

export function StudentAssessmentLeave() {
  const records = useQuery({ queryKey: ["assessment-leaves", "mine"], queryFn: assessmentLeaveApi.mine });
  return <div className="space-y-6 p-3 sm:p-6"><div><h1 className="text-2xl font-bold">Mening yakuniy baholash ta'tilim</h1><p className="text-sm text-muted-foreground">Yakuniy nazorat yoki himoya vaqtida ish joyingiz bergan, ish haqi saqlanadigan ta'til (kamida 15 kalendar kun) hujjatlari shu yerda ko'rinadi.</p><p className="mt-1 text-xs text-muted-foreground">Asos: 559-son qaror, 22-band.</p></div>
    <QueryState isLoading={records.isLoading} isError={records.isError} error={records.error} onRetry={() => { void records.refetch(); }} isEmpty={!records.data?.length} emptyText="Siz uchun ta'til hujjati hali kiritilmagan.">
      <div className="grid gap-4 lg:grid-cols-2">{(records.data ?? []).map((record) => <Card key={record.id} className={record.status === "VERIFIED" ? "border-emerald-400" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5" />{purposeLabel[record.leavePurpose] ?? record.leavePurpose}</CardTitle><CardDescription>{record.academicYear} · {record.assessmentReference}</CardDescription></div><Badge variant={record.status === "REJECTED" ? "destructive" : "secondary"}>{statusLabel(record.status)}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm"><b>{record.employerName}</b> · {record.jobTitle}<br/>{formatDate(record.leaveStartDate)} – {formatDate(record.leaveEndDate)} · <b>{record.calendarDays} kalendar kun</b></p><p className="rounded-md bg-muted p-3 text-sm"><b>Buyruq:</b> {record.leaveOrderNumber}, {formatDate(record.leaveOrderDate)}<br/><b>Ish haqi saqlanishi:</b> {record.salaryRetentionConfirmed ? "Tasdiqlangan" : "Tasdiqlanmagan"}<br/><b>Dalil:</b> {record.evidenceReference}</p>{record.status === "VERIFIED" && <p className="flex items-center gap-2 text-sm text-emerald-700"><BadgeCheck className="h-4 w-4" />Hujjat {record.verifiedByName} tomonidan tekshirilgan.</p>}{record.status === "DRAFT" && <p className="flex items-center gap-2 text-sm text-amber-700"><Clock3 className="h-4 w-4" />Vakolatli xodim tekshiruvi kutilmoqda.</p>}{record.status === "REJECTED" && <p className="flex items-center gap-2 text-sm text-red-700"><XCircle className="h-4 w-4" />{record.rejectionReason}</p>}</CardContent></Card>)}</div>
    </QueryState>
  </div>;
}
