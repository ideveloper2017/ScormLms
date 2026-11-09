import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryState } from "@/components/query-state";
import { practiceApi } from "@/services/api/practice-api";
import { statusLabel } from "@/lib/status-labels";
import { formatDate } from "@/lib/format-date";

export function StudentPractice() {
  const practices = useQuery({ queryKey: ["practices", "mine"], queryFn: practiceApi.mine });
  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Mening amaliyotim</h1><p className="text-sm text-muted-foreground">Amaliyotni qayerda va qachon o'tashingiz hamda u tasdiqlangan-tasdiqlanmagani shu yerda ko'rinadi.</p><p className="mt-1 text-xs text-muted-foreground">Asos: 559-son qaror, 23-band.</p></div>
    <QueryState isLoading={practices.isLoading} isError={practices.isError} error={practices.error} onRetry={() => { void practices.refetch(); }} isEmpty={!practices.data?.length} emptyText="Sizga amaliyot hali biriktirilmagan.">
      <div className="grid gap-4 lg:grid-cols-2">{(practices.data ?? []).map((practice) => { const WorkplaceIcon = practice.placementBasis === "CURRENT_WORKPLACE" ? BriefcaseBusiness : Building2; return <Card key={practice.id} className={practice.status === "COMPLETED" ? "border-emerald-400" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><WorkplaceIcon className="h-5 w-5" />{practice.organizationName}</CardTitle><CardDescription>{formatDate(practice.startsOn)} – {formatDate(practice.endsOn)} · {practice.academicYear}</CardDescription></div><Badge>{statusLabel(practice.status)}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="rounded-md bg-muted p-3 text-sm"><b>O'quv reja:</b> {practice.planReference}</p><p className="text-sm"><b>Joy:</b> {practice.organizationAddress}</p><p className="text-sm">{practice.placementBasis === "CURRENT_WORKPLACE" ? `Mutaxassislikka mos ish joyi · ${practice.jobTitle ?? "lavozim ko'rsatilmagan"}` : `OTM kelishuvi: ${practice.agreementNumber ?? "—"} (${formatDate(practice.agreementDate)})`}</p><p className="text-xs text-muted-foreground">Joylashtirish dalili: {practice.basisEvidenceReference}</p>{practice.status === "DRAFT" ? <p className="flex items-center gap-2 text-sm text-amber-700"><Clock3 className="h-4 w-4" />Amaliyot bo'limi tasdig'i kutilmoqda.</p> : practice.status === "CANCELLED" ? <p className="text-sm text-muted-foreground">Bu amaliyot bekor qilingan.</p> : <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />Amaliyot joyi tasdiqlangan.</p>}{practice.completionSummary && <div className="rounded-md border border-emerald-200 p-3 text-sm"><b>Yakuniy xulosa:</b> {practice.completionSummary}<br/><span className="text-xs text-muted-foreground">Dalil: {practice.completionEvidenceReference}</span></div>}</CardContent></Card>; })}</div>
    </QueryState>
  </div>;
}
