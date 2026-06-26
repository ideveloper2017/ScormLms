import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type GradebookEntry } from "@/services/api/teacher-portal-api";

function cellCls(v: number | undefined) {
  if (v === undefined || v === null) return "text-muted-foreground text-center";
  if (v >= 90) return "text-green-600 text-center font-medium";
  if (v >= 75) return "text-blue-600 text-center";
  if (v >= 60) return "text-yellow-600 text-center";
  return "text-red-600 text-center";
}

function colAvg(rows: GradebookEntry[], key: keyof GradebookEntry) {
  const vals = rows.map((r) => r[key]).filter((v): v is number => typeof v === "number");
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

function makeColumns(): ColumnDef<GradebookEntry>[] {
  return [
    {
      id: "no",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground text-xs text-center block">{row.index + 1}</span>,
    },
    {
      accessorKey: "studentName",
      header: "Talaba",
      footer: () => <span className="text-sm font-medium">Sinf o'rtachasi</span>,
      cell: ({ row }) => <div className="font-medium text-sm">{row.original.studentName}</div>,
    },
    {
      accessorKey: "assignments",
      header: "Topshiriqlar",
      footer: ({ table }) => {
        const rows = table.getFilteredRowModel().rows.map((r) => r.original);
        const val = colAvg(rows, "assignments");
        return <span className={cellCls(val ?? undefined)}>{val ?? "—"}</span>;
      },
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return <span className={cellCls(v)}>{v}</span>;
      },
    },
    {
      accessorKey: "tests",
      header: "Testlar",
      footer: ({ table }) => {
        const rows = table.getFilteredRowModel().rows.map((r) => r.original);
        const val = colAvg(rows, "tests");
        return <span className={cellCls(val ?? undefined)}>{val ?? "—"}</span>;
      },
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return <span className={cellCls(v)}>{v}</span>;
      },
    },
    {
      accessorKey: "attendance",
      header: "Davomat",
      footer: ({ table }) => {
        const rows = table.getFilteredRowModel().rows.map((r) => r.original);
        const val = colAvg(rows, "attendance");
        return <span className={cellCls(val ?? undefined)}>{val ?? "—"}</span>;
      },
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return <span className={cellCls(v)}>{v}%</span>;
      },
    },
    {
      accessorKey: "finalGrade",
      header: "Yakuniy",
      enableSorting: true,
      footer: ({ table }) => {
        const rows = table.getFilteredRowModel().rows.map((r) => r.original);
        const val = colAvg(rows, "finalGrade");
        return <span className={cellCls(val ?? undefined)}>{val ?? "—"}</span>;
      },
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return <span className={`${cellCls(v)} font-semibold`}>{v}</span>;
      },
    },
    {
      accessorKey: "letterGrade",
      header: "Baho",
      enableSorting: false,
      footer: () => null,
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return <span className="text-center block font-bold">{v}</span>;
      },
    },
  ];
}

export function TeacherGradebook() {
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
    staleTime: 60_000,
  });

  const courseId = selectedCourseId || courses[0]?.id || "";

  const { data: gradebook = [], isLoading: gbLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.gradebook(courseId),
    queryFn: () => teacherPortalApi.getGradebook(courseId),
    staleTime: 60_000,
    enabled: !!courseId,
  });

  const columns = useMemo(() => makeColumns(), []);

  const filtered = gradebook.filter((s) => {
    const t = search.toLowerCase();
    return !t || s.studentName.toLowerCase().includes(t);
  });

  const topCount = filtered.filter((s) => s.finalGrade >= 90).length;
  const avgFinal = filtered.length
    ? Math.round(filtered.reduce((s, r) => s + r.finalGrade, 0) / filtered.length)
    : 0;

  if (coursesLoading || gbLoading) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (error) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Baholash jurnali</h1>
      <Card className="border-destructive/50">
        <CardContent className="pt-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Baholash jurnali</h1>
          <p className="text-muted-foreground">Talabalar baholarini boshqarish</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />Excel yuklash
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Jami talabalar", value: filtered.length,                  cls: "" },
          { label: "O'rtacha ball",  value: avgFinal || "—",                  cls: "text-blue-600" },
          { label: "A'lochi (%)",    value: `${Math.round(topCount / (filtered.length || 1) * 100)}%`, cls: "text-green-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={courseId}
          onValueChange={(v) => setSelectedCourseId(v)}
        >
          <SelectTrigger className="w-64"><SelectValue placeholder="Kurs tanlang" /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Talaba ismi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            data={filtered}
            defaultPageSize={20}
            emptyText="Talaba topilmadi"
          />
        </CardContent>
      </Card>
    </div>
  );
}
