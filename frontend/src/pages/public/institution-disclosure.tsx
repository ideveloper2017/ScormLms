import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, GraduationCap, ShieldAlert, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryLabels, officialSitePublicationApi, type OfficialSitePublicationCategory } from "@/services/api/official-site-publication-api";

const categories: OfficialSitePublicationCategory[] = ["CHARTER_OR_STATUTE", "CURRICULA_AND_PROGRAMS", "TEACHING_STAFF", "ACADEMIC_CALENDAR"];
const icons = { CHARTER_OR_STATUTE: FileText, CURRICULA_AND_PROGRAMS: GraduationCap, TEACHING_STAFF: Users, ACADEMIC_CALENDAR: CalendarDays };

export function PublicInstitutionDisclosure() {
  const disclosure = useQuery({ queryKey: ["public-institution-disclosure"], queryFn: officialSitePublicationApi.publicDisclosure });
  return <main className="min-h-screen bg-muted/30"><header className="border-b bg-background"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5"><div><h1 className="text-2xl font-bold">Ta'lim tashkiloti haqida rasmiy axborot</h1><p className="text-sm text-muted-foreground">559-son qarorning 8-bandi bo'yicha ommaviy ma'lumotlar</p></div><Button asChild variant="outline"><Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" />LMSga kirish</Link></Button></div></header><div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
    {disclosure.isLoading && <Card><CardContent className="py-10 text-center">Rasmiy axborot yuklanmoqda...</CardContent></Card>}
    {disclosure.isError && <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertDescription>Rasmiy axborotni yuklab bo'lmadi. Keyinroq qayta urinib ko'ring.</AlertDescription></Alert>}
    {disclosure.data && <><Alert variant={disclosure.data.complete ? "default" : "destructive"}>{disclosure.data.complete ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}<AlertDescription>{disclosure.data.complete ? "Qarorda ko'rsatilgan to'rtta axborot toifasining barchasida amaldagi tasdiqlangan nashr mavjud." : `To'liq emas. Yetishmayotgan toifalar: ${disclosure.data.missingCategories.map((item) => categoryLabels[item]).join(", ")}.`}</AlertDescription></Alert><div className="grid gap-6 md:grid-cols-2">{categories.map((category) => { const Icon = icons[category]; const items = disclosure.data!.publications.filter((item) => item.category === category); return <section key={category} className="space-y-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><Icon className="h-5 w-5" />{categoryLabels[category]} <Badge variant="outline">{items.length}</Badge></h2>{items.map((item) => <Card key={`${item.slug}-${item.versionCode}`}><CardHeader><CardTitle className="text-base">{item.title}</CardTitle><CardDescription>v{item.versionCode} · {item.effectiveFrom} — {item.effectiveTo ?? "amaldagi"}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><p className="whitespace-pre-wrap leading-6">{item.summary}</p><p className="text-muted-foreground">Manba: {item.sourceDocumentNumber}, {item.sourceDocumentDate}</p><p className="break-all text-xs text-muted-foreground">{item.sourceReference}</p></CardContent></Card>)}{items.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-red-700">Amaldagi tasdiqlangan nashr mavjud emas.</CardContent></Card>}</section>; })}</div><p className="text-center text-xs text-muted-foreground">Snapshot vaqti: {new Date(disclosure.data.generatedAt).toLocaleString("uz-UZ")}</p></>}
  </div></main>;
}
