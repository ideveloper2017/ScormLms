import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { curriculumLabel, groupBySubject, hoursText } from "@/lib/curriculum-subjects";
import { curriculumApi } from "@/services/api/curriculum-api";
import type { SubjectSyllabus } from "@/services/api/syllabus-api";

const select = "h-10 w-full rounded-md border bg-background px-3 text-sm";

/**
 * Dasturni o'quv reja faniga biriktirish: reja tanlanadi, unda shu fanning qatorlari (semestrlari) ko'rinadi.
 * Biriktirilgach talaba shu rejadagi fanni dastur bo'yicha o'qiydi (dastur tasdiqlangan bo'lsa).
 */
export function SyllabusPlanLinkDialog({ syllabus, onClose, onLinked }: { syllabus: SubjectSyllabus; onClose: () => void; onLinked: () => unknown }) {
  const { toast } = useToast();
  const curricula = useQuery({ queryKey: ["curricula"], queryFn: () => curriculumApi.list() });
  const options = (curricula.data ?? []).filter((c) => c.status !== "ARCHIVED");
  const [chosen, setChosen] = useState<number | null>(null);
  const curriculumId = chosen ?? options[0]?.id ?? null;
  const curriculum = useQuery({ queryKey: ["curricula", curriculumId], queryFn: () => curriculumApi.get(curriculumId!), enabled: curriculumId != null });
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  // Fanga bog'langan dastur — faqat shu fan; fansiz dastur — rejadagi istalgan fan (biriktirilganda fan yoziladi)
  const groups = groupBySubject(curriculum.data?.subjects ?? [])
    .filter((rows) => rows[0].subjectId != null && (syllabus.subjectId == null || rows[0].subjectId === syllabus.subjectId))
    .filter((rows) => !needle || rows[0].subjectName.toLowerCase().includes(needle) || (rows[0].subjectCode ?? "").toLowerCase().includes(needle));
  const [error, setError] = useState<string | null>(null);
  const attach = useMutation({
    mutationFn: (itemId: number) => curriculumApi.attachSyllabus(curriculumId!, itemId, syllabus.id),
    onSuccess: async () => { toast({ title: "Dastur o'quv reja faniga biriktirildi" }); await onLinked(); },
    onError: (e) => setError(extractApiError(e, "Biriktirilmadi").message),
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !attach.isPending) onClose(); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>O'quv rejaga biriktirish</DialogTitle>
        <DialogDescription>«{syllabus.name}»{syllabus.subjectName ? ` — ${syllabus.subjectName}` : " — hali fanga biriktirilmagan"}. Talaba rejadagi fanni ushbu dastur bo'yicha o'qiydi.</DialogDescription>
      </DialogHeader>
      {curricula.isLoading ? <Loader2 className="h-5 w-5 animate-spin" />
        : options.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Faol o'quv reja yo'q.</p>
        : <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="pl-curriculum">O'quv reja</Label>
            <select id="pl-curriculum" className={select} value={curriculumId ?? ""} onChange={(e) => { setChosen(Number(e.target.value)); setError(null); }}>
              {options.map((c) => <option key={c.id} value={c.id}>{curriculumLabel(c)}</option>)}
            </select></div>
          {syllabus.subjectId == null && <Input aria-label="Fan qidirish" placeholder="Fan nomi yoki kodi" value={query} onChange={(e) => setQuery(e.target.value)} />}
          {curriculum.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {curriculum.isSuccess && groups.length === 0 && <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            {syllabus.subjectName ? `Bu rejada «${syllabus.subjectName}» fani yo'q.` : "Fan topilmadi."}</p>}
          {groups.map((rows) => {
            const first = rows[0];
            const linked = first.syllabusId === syllabus.id;
            return <div key={first.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{first.planRowNumber ? `${first.planRowNumber} ` : ""}{first.subjectName}</p>
                <p className="text-xs text-muted-foreground">{rows.map((r) => r.semester).join(", ")}-semestr · {hoursText(rows)}</p>
                <p className="text-xs text-muted-foreground">Hozir: {first.syllabusName ?? "dastur biriktirilmagan"}</p>
              </div>
              {linked ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-4 w-4" />Biriktirilgan</span>
                : <Button size="sm" disabled={attach.isPending} onClick={() => attach.mutate(first.id)}>
                  {attach.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}{first.syllabusId ? "Almashtirish" : "Biriktirish"}</Button>}
            </div>;
          })}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>}
      <DialogFooter><Button variant="outline" onClick={onClose}>Yopish</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
