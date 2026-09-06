import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Edit, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";
import { useToast } from "@/hooks/use-toast";

const STATUS_META: Record<string, { label: string; className: string }> = {
  published: { label: "Faol", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  draft: { label: "Qoralama", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  archived: { label: "Arxivlangan", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
};

export function TeacherCourses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
    staleTime: 60_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) =>
      teacherPortalApi.updateCourseStatus(id, status),
    onSuccess: async (course) => {
      await queryClient.invalidateQueries({ queryKey: qk.teacher.courses() });
      toast({ title: "Kurs holati yangilandi", description: course.title });
    },
    onError: (cause) => toast({ variant: "destructive", title: "Holat yangilanmadi", description: cause instanceof Error ? cause.message : undefined }),
  });
  const deleteMutation = useMutation({
    mutationFn: teacherPortalApi.deleteCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.teacher.courses() });
      toast({ title: "Kurs o'chirildi" });
    },
    onError: (cause) => toast({ variant: "destructive", title: "Kurs o'chirilmadi", description: cause instanceof Error ? cause.message : undefined }),
  });

  const copyMutation = useMutation({
    mutationFn: teacherPortalApi.copyCourse,
    onSuccess: async (course) => {
      await queryClient.invalidateQueries({ queryKey: qk.teacher.courses() });
      toast({ title: 'Kurs qoralamasi nusxalandi', description: 'Bo‘limlar va oddiy materiallar tayyor. Nashr qilishdan oldin tekshiring.' });
      navigate(`/teacher/courses/${course.id}/contents`);
    },
    onError: (cause: Error) => toast({ variant: 'destructive', title: 'Kurs nusxalanmadi', description: cause.message }),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) =>
      (!term || `${course.title} ${course.subjectName ?? ""} ${course.categoryName ?? ""}`.toLowerCase().includes(term)) &&
      (statusFilter === "all" || course.status === statusFilter),
    );
  }, [courses, search, statusFilter]);
  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * size, currentPage * size);

  if (isLoading) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-80 w-full" /></div>;
  if (error) return (
    <div className="space-y-4 p-6">
      <Card className="border-destructive/50"><CardContent className="space-y-3 py-10 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <p className="font-medium text-destructive">Kurslarni yuklab bo'lmadi</p>
        <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mening kurslarim</h1>
          <p className="text-sm text-muted-foreground">Kurslar, kategoriyalar va holatlarni boshqarish</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/teacher/courses/create")}><Plus className="h-4 w-4" />Yangi kurs yaratish</Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-lg">Kurslar ro'yxati</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Qidirish" className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="published">Faol</SelectItem>
                  <SelectItem value="archived">Arxiv</SelectItem>
                </SelectContent>
              </Select>
              <Select value={pageSize} onValueChange={(value) => { setPageSize(value); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-24"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="pl-5">Kurs</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Kategoriya</TableHead>
              <TableHead>Fan guruhi</TableHead>
              <TableHead>Til / daraja</TableHead>
              <TableHead>Narx</TableHead>
              <TableHead className="pr-5 text-right">Amallar</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visible.length === 0 && <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Kurs topilmadi</TableCell></TableRow>}
              {visible.map((course) => {
                const meta = STATUS_META[course.status] ?? STATUS_META.draft;
                return <TableRow key={course.id}>
                  <TableCell className="min-w-64 pl-5">
                    <button className="flex items-center gap-3 text-left" onClick={() => navigate(`/teacher/courses/${course.id}/contents`)}>
                      <span className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-4 w-4 text-primary" /></span>
                      <span><span className="block font-medium">{course.title}</span><span className="block max-w-56 truncate text-xs text-muted-foreground">{course.shortDescription || course.subjectName || "—"}</span></span>
                    </button>
                  </TableCell>
                  <TableCell><Badge className={meta.className}>{meta.label}</Badge></TableCell>
                  <TableCell>{course.categoryName || "—"}</TableCell>
                  <TableCell><span className="block">{course.subjectName || "—"}</span><span className="text-xs text-muted-foreground">{course.groupName || "—"}</span></TableCell>
                  <TableCell>{(course.language || "—").toUpperCase()} · {levelLabel(course.level)}</TableCell>
                  <TableCell>
                    {course.paid
                      ? `${course.discountEnabled ? (course.discountedPrice ?? course.price ?? 0) : (course.price ?? 0)} so'm`
                      : "Bepul"}
                  </TableCell>
                  <TableCell className="pr-5"><div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={copyMutation.isPending} onClick={() => copyMutation.mutate(course.id)}>Nusxa olish</Button>
                    <Button variant="secondary" size="icon" aria-label="Kursni tahrirlash" onClick={() => navigate(`/teacher/courses/${course.id}/contents`)}><Edit className="h-4 w-4 text-emerald-600" /></Button>
                    {course.status === "draft" && <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: course.id, status: "PUBLISHED" })}>Nashr</Button>}
                    <Button variant="destructive" size="icon" aria-label="Kursni o'chirish" disabled={course.status === "published" || deleteMutation.isPending} onClick={() => deleteMutation.mutate(course.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div></TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Jami {filtered.length} ta kurs</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(1)}>&lt;&lt; Birinchi</Button>
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Oldingi</Button>
              <strong>{currentPage} / {totalPages}</strong>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Keyingi</Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>Oxirgi &gt;&gt;</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function levelLabel(value?: string | null) {
  if (value === "BEGINNER") return "Boshlang'ich";
  if (value === "INTERMEDIATE") return "O'rta";
  if (value === "ADVANCED") return "Yuqori";
  return value || "—";
}
