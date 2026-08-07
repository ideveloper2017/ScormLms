import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Clock3, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { canAcknowledgeOrientation, orientationApi } from "@/services/api/orientation-api";

export function StudentOrientation() {
  const { toast } = useToast();
  const client = useQueryClient();
  const orientation = useQuery({ queryKey: ["orientations", "me"], queryFn: orientationApi.mine });
  const acknowledge = useMutation({
    mutationFn: orientationApi.acknowledge,
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["orientations", "me"] }); toast({ title: "LMS yo'riqnomasi qabul qilindi" }); },
    onError: (error: Error) => toast({ variant: "destructive", title: "Tasdiqlash bajarilmadi", description: error.message }),
  });
  const data = orientation.data;
  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">LMS bilan tanishtirish</h1><p className="text-sm text-muted-foreground">559-son qaror 21-bandi bo'yicha boshlang'ich shaxsan orientatsiya; xorijiy davlat fuqarolariga bu talab tatbiq etilmaydi.</p></div>
    <Card className={data?.orientationRequired ? "border-amber-400" : "border-emerald-400"}><CardHeader><CardTitle className="flex items-center gap-2">{data?.orientationRequired ? <ShieldAlert className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}{data?.orientationRequired ? "Orientatsiya yakunlanmagan" : "Orientatsiya talabi bajarilgan"}</CardTitle><CardDescription>{data?.orientationRequired ? "Shaxsan qatnashuv qayd etilib, yo'riqnoma qabul qilinmaguncha kursga biriktirish bloklanadi." : data?.orientationCompletedAt ? `Tasdiqlangan: ${new Date(data.orientationCompletedAt).toLocaleString("uz-Latn")}` : "Siz uchun majburiy orientatsiya talabi mavjud emas."}</CardDescription></CardHeader></Card>
    <div className="grid gap-4 lg:grid-cols-2">{(data?.sessions ?? []).map((attendee) => <Card key={attendee.id}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-lg">{attendee.sessionTitle}</CardTitle><CardDescription>{attendee.venue} · {new Date(attendee.startsAt).toLocaleString("uz-Latn")}</CardDescription></div><Badge>{attendee.attendanceStatus}</Badge></div></CardHeader><CardContent className="space-y-3">{attendee.instructions && <p className="rounded-md bg-muted p-3 text-sm">{attendee.instructions}</p>}<p className="text-sm">{attendee.attendanceStatus === "PRESENT" ? "Xodim shaxsan qatnashganingizni tasdiqladi." : "Xodim qatnashuv holatini qayd etishini kuting."}</p>{attendee.acknowledgementAt ? <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />Yo'riqnoma {new Date(attendee.acknowledgementAt).toLocaleString("uz-Latn")} da qabul qilingan.</p> : canAcknowledgeOrientation(attendee) ? <Button disabled={acknowledge.isPending} onClick={() => acknowledge.mutate(attendee.sessionId)}><ClipboardCheck className="mr-2 h-4 w-4" />LMS yo'riqnomasini qabul qilaman</Button> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />Tasdiqlash uchun shaxsan qatnashuv qaydini kuting.</p>}</CardContent></Card>)}{data?.sessions.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Siz uchun orientatsiya sessiyasi hali e'lon qilinmagan.</CardContent></Card>}</div>
  </div>;
}
