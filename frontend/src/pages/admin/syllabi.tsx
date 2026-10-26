import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BookOpenCheck, CheckCircle2, MoreHorizontal, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CreateSyllabusDialog, CurriculumSyllabusWorkflow, CurriculumTopicsDialog, LinkSyllabusDialog,
} from "@/components/admin/curriculum-syllabus-link";
import { syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { useAuth } from "@/contexts/auth-context";
import { curriculumLabel, groupBySubject, hoursText } from "@/lib/curriculum-subjects";
import { hasAuthority } from "@/lib/rbac-api";
import { languageLabel } from "@/lib/syllabus";
import { curriculumApi, type CurriculumSubject } from "@/services/api/curriculum-api";

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

/**
 * O'quv dasturi: o'quv reja tanlanadi, uning har bir faniga o'quv dasturi yaratiladi (yoki mavjudi biriktiriladi)
 * va mavzulari kiritiladi. O'quv rejaning o'zi (fanlar, kredit, soatlar) "O'quv reja" bo'limida.
 */
export function AdminSyllabi() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const queryClient = useQueryClient();
  const curricula = useQuery({ queryKey: ["curricula"], queryFn: () => curriculumApi.list() });
  // Arxivlangan rejaga dastur biriktirilmaydi
  const options = (curricula.data ?? []).filter((c) => c.status !== "ARCHIVED");
  const [chosenId, setChosenId] = useState<number | null>(null);
  const curriculumId = options.some((c) => c.id === chosenId) ? chosenId : options[0]?.id ?? null;
  const curriculum = useQuery({
    queryKey: ["curricula", curriculumId],
    queryFn: () => curriculumApi.get(curriculumId!),
    enabled: curriculumId != null,
  });
  const groups = groupBySubject(curriculum.data?.subjects ?? []).filter((rows) => rows[0].subjectId != null);
  const withSyllabus = groups.filter((rows) => rows[0].syllabusId).length;

  const [creating, setCreating] = useState<{ itemId?: number } | null>(null);
  const [topicsItemId, setTopicsItemId] = useState<number | null>(null);
  const [workflow, setWorkflow] = useState<CurriculumSubject | null>(null);
  const [linking, setLinking] = useState<CurriculumSubject | null>(null);
  const topicsRows = groups.find((rows) => rows.some((r) => r.id === topicsItemId));
  const reload = () => queryClient.invalidateQueries({ queryKey: ["curricula", curriculumId] });

  return (
    <div className="space-y-6 p-3 sm:p-6">
      {creating && curriculumId != null && (
        <CreateSyllabusDialog curricula={options} curriculumId={curriculumId} itemId={creating.itemId}
          onClose={() => setCreating(null)}
          onCreated={async (id, itemId) => {
            // Yangi dastur fan dasturlari ro'yxatida ham ko'rinishi kerak (mavzular oynasi shu ro'yxatdan oladi)
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["curricula", id] }),
              queryClient.invalidateQueries({ queryKey: ["syllabi"] }),
            ]);
            setChosenId(id);
            setCreating(null);
            setTopicsItemId(itemId);
          }} />
      )}
      {topicsRows?.[0].syllabusId && (
        <CurriculumTopicsDialog rows={topicsRows} canWrite={canWrite} onSaved={reload} onClose={() => setTopicsItemId(null)} />
      )}
      {workflow && <CurriculumSyllabusWorkflow subject={workflow} canWrite={canWrite} onChanged={reload} onClose={() => setWorkflow(null)} />}
      {linking && curriculumId != null && (
        <LinkSyllabusDialog curriculumId={curriculumId} subject={linking}
          onClose={() => setLinking(null)} onLinked={async () => { await reload(); setLinking(null); }} />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">O'quv dasturi</h1>
          <p className="text-sm text-muted-foreground">
            O'quv rejadagi har bir fan uchun o'quv dasturi va mavzulari. Soatlar fan bo'yicha o'quv rejada belgilanadi.
          </p>
        </div>
        {canWrite && curriculumId != null && (
          <Button onClick={() => setCreating({})}><Plus className="mr-2 h-4 w-4" />Yangi o'quv dasturi</Button>
        )}
      </div>

      {curricula.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 p-3 text-sm">
          O'quv rejalar yuklanmadi.
          <Button size="sm" variant="outline" onClick={() => curricula.refetch()}>Qayta yuklash</Button>
        </div>
      )}
      {curricula.isSuccess && options.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          O'quv reja yo'q. Avval "O'quv reja" bo'limida reja yarating yoki ishchi o'quv rejani Excel'dan yuklang.
        </p>
      )}

      {options.length > 0 && (
        <div className="max-w-xl space-y-1.5">
          <Label htmlFor="syllabi-curriculum">O'quv reja</Label>
          <select id="syllabi-curriculum" className={selectClass} value={curriculumId ?? ""} onChange={(e) => setChosenId(Number(e.target.value))}>
            {options.map((c) => <option key={c.id} value={c.id}>{curriculumLabel(c)}</option>)}
          </select>
        </div>
      )}

      {curriculum.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5" />Fanlar va o'quv dasturlari</CardTitle>
            <CardDescription>{groups.length} ta fandan {withSyllabus} tasiga o'quv dasturi tuzilgan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">T/r</TableHead>
                    <TableHead>Fan</TableHead>
                    <TableHead>Semestr</TableHead>
                    <TableHead>Rejadagi soatlar</TableHead>
                    <TableHead>O'quv dasturi</TableHead>
                    <TableHead>Mavzular</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((rows) => {
                    const first = rows[0];
                    return (
                      <TableRow key={first.id}>
                        <TableCell className="text-muted-foreground">{first.planRowNumber ?? "—"}</TableCell>
                        <TableCell>
                          <p className="font-medium">{first.subjectName}</p>
                          <p className="text-xs text-muted-foreground">{first.subjectCode}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{rows.map((r) => r.semester).join(", ")}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm tabular-nums">{hoursText(rows)}</TableCell>
                        <TableCell>
                          {first.syllabusId ? (
                            <>
                              <p className="text-sm">{first.syllabusName}</p>
                              <p className="text-xs text-muted-foreground">
                                {languageLabel(first.syllabusLanguage)}
                                {first.syllabusStatus && <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px]">{syllabusStatuses[first.syllabusStatus]}</Badge>}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Tuzilmagan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {first.syllabusId ? (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setTopicsItemId(first.id)}
                              title={first.syllabusComplete ? "Rejadagi barcha mashg'ulot turlariga mavzu kiritilgan" : "Ba'zi mashg'ulot turlariga hali mavzu kiritilmagan"}>
                              {first.syllabusComplete
                                ? <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-600" />
                                : <AlertTriangle className="mr-1 h-3.5 w-3.5 text-amber-600" />}
                              {first.syllabusTopicCount ?? 0} mavzu
                            </Button>
                          ) : canWrite ? (
                            <Button size="sm" variant="secondary" className="h-8" onClick={() => setCreating({ itemId: first.id })}>
                              <Plus className="mr-1 h-3.5 w-3.5" />Dastur yaratish
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {first.syllabusId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${first.subjectName} — amallar`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setWorkflow(first)}>Tasdiqlash va tarix</DropdownMenuItem>
                                {canWrite && <DropdownMenuItem onClick={() => setLinking(first)}>Boshqa dasturni tanlash</DropdownMenuItem>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {groups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Bu rejada fan yo'q. Fanlarni "O'quv reja" bo'limida qo'shing yoki Excel'dan yuklang.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
