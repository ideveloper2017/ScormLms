import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { practiceApi } from "@/services/api/practice-api";

export function StudentPractice() {
  const practices = useQuery({ queryKey: ["practices", "mine"], queryFn: practiceApi.mine });
  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Mening amaliyotim</h1><p className="text-sm text-muted-foreground">559-son qaror 23-bandi bo'yicha o'quv reja muddati va tasdiqlangan amaliyot joyi.</p></div>
    <div className="grid gap-4 lg:grid-cols-2">{(practices.data ?? []).map((practice) => { const WorkplaceIcon = practice.placementBasis === "CURRENT_WORKPLACE" ? BriefcaseBusiness : Building2; return <Card key={practice.id} className={practice.status === "COMPLETED" ? "border-emerald-400" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><WorkplaceIcon className="h-5 w-5" />{practice.organizationName}</CardTitle><CardDescription>{practice.startsOn} - {practice.endsOn} · {practice.academicYear}</CardDescription></div><Badge>{practice.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="rounded-md bg-muted p-3 text-sm"><b>O'quv reja:</b> {practice.planReference}</p><p className="text-sm"><b>Joy:</b> {practice.organizationAddress}</p><p className="text-sm">{practice.placementBasis === "CURRENT_WORKPLACE" ? `Mutaxassislikka mos ish joyi · ${practice.jobTitle}` : `OTM kelishuvi: ${practice.agreementNumber} (${practice.agreementDate})`}</p><p className="text-xs text-muted-foreground">Joylashtirish dalili: {practice.basisEvidenceReference}</p>{practice.status === "DRAFT" ? <p className="flex items-center gap-2 text-sm text-amber-700"><Clock3 className="h-4 w-4" />Amaliyot bo'limi tasdig'i kutilmoqda.</p> : <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />23-band joylashtirish qoidasi bo'yicha tasdiqlangan.</p>}{practice.completionSummary && <div className="rounded-md border border-emerald-200 p-3 text-sm"><b>Yakuniy xulosa:</b> {practice.completionSummary}<br/><span className="text-xs text-muted-foreground">Dalil: {practice.completionEvidenceReference}</span></div>}</CardContent></Card>; })}{practices.data?.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Sizga amaliyot hali biriktirilmagan.</CardContent></Card>}</div>
  </div>;
}

