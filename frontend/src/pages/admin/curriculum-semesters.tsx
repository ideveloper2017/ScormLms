import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAcademicPeriods } from "@/pages/admin/academic-periods";
import { curriculumApi, curriculumStatusLabels, type CurriculumSemesterOverview } from "@/services/api/curriculum-api";
import { formatDate } from "@/lib/format-date";

type PeriodState = "current" | "upcoming" | "finished" | "inactive" | "missing";
const stateLabel: Record<PeriodState, string> = {
  current: "Joriy", upcoming: "Kelgusi", finished: "Tugagan", inactive: "Nofaol", missing: "Muddat kiritilmagan",
};
const today = () => new Date().toISOString().slice(0, 10);

const periodState = (row: CurriculumSemesterOverview, now: string): PeriodState => {
  if (!row.startsOn || !row.endsOn) return "missing";
  if (row.active === false) return "inactive";
  if (now < row.startsOn) return "upcoming";
  return now > row.endsOn ? "finished" : "current";
};

/**
 * "Semestrlar": har bir o'quv reja semestri va uning muddati (joriy / kelgusi / tugagan). Muddat reja tasdiqlanganda
 * kuzgi/bahorgi sanalardan yaratiladi, o'zgartirish — "O'quv rejaga biriktirilgan talabalar" sahifasida.
 * Ikkinchi tab — semestrlar katalogi (1..12, kurs raqami).
 */
export function CurriculumSemesters() {
  return <div className="space-y-6 p-3 sm:p-6">
    <div>
      <h1 className="text-2xl font-bold">Semestrlar</h1>
      <p className="text-sm text-muted-foreground">O'quv rejalar kesimida semestrlar va ularning muddatlari.</p>
    </div>
    <Tabs defaultValue="plans">
      <TabsList>
        <TabsTrigger value="plans">Rejalar kesimida</TabsTrigger>
        <TabsTrigger value="catalog">Semestrlar katalogi</TabsTrigger>
      </TabsList>
      <TabsContent value="plans" className="mt-4"><PlanSemesters /></TabsContent>
      <TabsContent value="catalog" className="mt-4"><AdminAcademicPeriods view="semesters" /></TabsContent>
    </Tabs>
  </div>;
}

function PlanSemesters() {
  const navigate = useNavigate();
  const [curriculumId, setCurriculumId] = useState(0);
  const [year, setYear] = useState("");
  const [state, setState] = useState<PeriodState | "">("");
  const overview = useQuery({ queryKey: ["curricula", "semester-periods"], queryFn: curriculumApi.semesterOverview });
  const now = today();
  const rows = useMemo(() => (overview.data ?? []).map((row) => ({ ...row, state: periodState(row, now) })), [overview.data, now]);
  const curricula = [...new Map(rows.map((row) => [row.curriculumId, `${row.curriculumName} · ${row.versionCode}`])).entries()];
  const years = [...new Set(rows.map((row) => row.academicYear))].sort().reverse();
  const visible = rows.filter((row) => (!curriculumId || row.curriculumId === curriculumId)
    && (!year || row.academicYear === year) && (!state || row.state === state));

  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <label className="space-y-1 text-xs">O'quv reja
        <select aria-label="O'quv reja" className="block h-10 min-w-56 rounded-md border bg-background px-3 text-sm" value={curriculumId}
          onChange={(e) => setCurriculumId(Number(e.target.value))}>
          <option value={0}>Barchasi</option>
          {curricula.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs">O'quv yili
        <select aria-label="O'quv yili" className="block h-10 min-w-36 rounded-md border bg-background px-3 text-sm" value={year}
          onChange={(e) => setYear(e.target.value)}>
          <option value="">Barchasi</option>
          {years.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs">Holati
        <select aria-label="Holati" className="block h-10 min-w-40 rounded-md border bg-background px-3 text-sm" value={state}
          onChange={(e) => setState(e.target.value as PeriodState | "")}>
          <option value="">Barchasi</option>
          {(Object.keys(stateLabel) as PeriodState[]).map((value) => <option key={value} value={value}>{stateLabel[value]}</option>)}
        </select>
      </label>
    </div>

    {overview.isLoading && <div className="flex justify-center p-10"><Loader2 className="animate-spin" aria-label="Yuklanmoqda" /></div>}
    {overview.isError && <Card className="border-destructive"><CardContent className="space-y-3 p-8 text-center">
      <p className="text-sm text-destructive">Semestrlarni yuklab bo'lmadi.</p>
      <Button variant="outline" onClick={() => void overview.refetch()}>Qayta urinish</Button>
    </CardContent></Card>}

    {overview.isSuccess && <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-12">№</TableHead>
          <TableHead>Holati</TableHead>
          <TableHead>Nomi</TableHead>
          <TableHead>O'quv yili</TableHead>
          <TableHead>Boshlanish sanasi</TableHead>
          <TableHead>Tugash sanasi</TableHead>
          <TableHead>O'quv reja</TableHead>
          <TableHead className="text-right">Amallar</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {visible.map((row, index) => <TableRow key={`${row.curriculumId}-${row.semesterNumber}`}>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell><Badge variant={row.state === "current" ? "default" : row.state === "missing" ? "destructive" : "secondary"}>{stateLabel[row.state]}</Badge></TableCell>
            <TableCell className="font-medium">{row.semesterNumber}-semestr</TableCell>
            <TableCell>{row.academicYear}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDate(row.startsOn)}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDate(row.endsOn)}</TableCell>
            <TableCell>
              <p className="text-sm">{row.curriculumName}</p>
              <p className="text-xs text-muted-foreground">{row.versionCode} · {curriculumStatusLabels[row.curriculumStatus]}</p>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" title="Semestr muddatini kiritish yoki o'zgartirish"
                onClick={() => navigate(`/edu-process/attached-students?curriculumId=${row.curriculumId}&semester=${row.semesterNumber}`)}>
                <CalendarClock className="mr-1.5 h-4 w-4" />Muddat
              </Button>
            </TableCell>
          </TableRow>)}
          {visible.length === 0 && <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Semestr topilmadi</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>}
  </div>;
}
