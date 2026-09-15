import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Archive, BookOpen, Copy, Edit, MoreHorizontal, Plus, RefreshCw, Search, Trash2, Undo2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type TeacherCourse } from "@/services/api/teacher-portal-api";
import { useToast } from "@/hooks/use-toast";

const STATUS_META: Record<string, { label: string; className: string }> = {
  published: { label: "Faol", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  draft: { label: "Qoralama", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  archived: { label: "Arxivlangan", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
};

type CourseAction = { course: TeacherCourse; action: 'copy' | 'delete' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' };

export function TeacherCourses({ title = "Mening kurslarim" }: { title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("title");
  const [confirmation, setConfirmation] = useState<CourseAction | null>(null);
  const [actionError, setActionError] = useState("");
  const actionLock = useRef(false);
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
    staleTime: 60_000,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ course, action }: CourseAction) => {
      if (action === 'delete') return teacherPortalApi.deleteCourse(course.id);
      if (action === 'copy') return teacherPortalApi.copyCourse(course.id);
      return teacherPortalApi.updateCourseStatus(course.id, action);
    },
    onSuccess: async (result, { course, action }) => {
      if (action === 'delete') queryClient.removeQueries({ queryKey: ['teacher', 'course', course.id] });
      else if (action !== 'copy') await queryClient.invalidateQueries({ queryKey: ['teacher', 'course', course.id] });
      await queryClient.invalidateQueries({ queryKey: qk.teacher.courses() });
      setConfirmation(null);
      toast({ title: action === 'delete' ? "Kurs o'chirildi" : action === 'copy' ? 'Kurs qoralamasi nusxalandi' : 'Kurs holati yangilandi', description: course.title });
      if (action === 'copy' && result) navigate(`/teacher/courses/${result.id}/contents`);
    },
    onError: (cause: Error) => {
      setActionError(cause.message);
      toast({ variant: 'destructive', title: 'Amal bajarilmadi', description: cause.message });
    },
  });
  const runAction = async (action: CourseAction) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setActionError('');
    try { await actionMutation.mutateAsync(action); } catch { /* Error is shown by the mutation. */ }
    finally { actionLock.current = false; }
  };
  const askConfirmation = (action: CourseAction) => { setActionError(''); setConfirmation(action); };
  const categories = [...new Set(courses.map(course => course.categoryName).filter((name): name is string => Boolean(name)))].sort();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) =>
      (!term || `${course.title} ${course.subjectName ?? ""} ${course.categoryName ?? ""} ${course.groupName ?? ""}`.toLowerCase().includes(term)) &&
      (statusFilter === "all" || course.status === statusFilter) &&
      (!categoryFilter || course.categoryName === categoryFilter),
    ).sort((a, b) => (sort === 'title-desc' ? -1 : 1) * a.title.localeCompare(b.title));
  }, [courses, search, statusFilter, categoryFilter, sort]);
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
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">Kurslar, kategoriyalar va holatlarni boshqarish</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/teacher/courses/create")}><Plus className="h-4 w-4" />Yangi kurs yaratish</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Kurslar holati bo'yicha hisob">
        {[{ value: 'all', label: 'Barcha kurslar' }, { value: 'draft', label: 'Qoralamalar' }, { value: 'published', label: 'Nashrdagi kurslar' }, { value: 'archived', label: 'Arxivdagi kurslar' }].map(item =>
          <button key={item.value} aria-pressed={statusFilter === item.value} onClick={() => { setStatusFilter(item.value); setPage(1); }} className={`rounded-xl border p-4 text-left transition-colors hover:bg-muted ${statusFilter === item.value ? 'border-primary bg-primary/5' : 'bg-card'}`}>
            <span className="block text-sm text-muted-foreground">{item.label}</span><span className="mt-2 block text-2xl font-semibold">{item.value === 'all' ? courses.length : courses.filter(course => course.status === item.value).length}</span>
          </button>)}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-lg">Kurslar ro'yxati</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <div className="relative w-full min-w-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Kurs qidirish" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Kurs, fan yoki guruh" className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
                <SelectTrigger aria-label="Kurs holati" className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="published">Faol</SelectItem>
                  <SelectItem value="archived">Arxiv</SelectItem>
                </SelectContent>
              </Select>
              <Select value={pageSize} onValueChange={(value) => { setPageSize(value); setPage(1); }}>
                <SelectTrigger aria-label="Sahifadagi kurslar soni" className="w-full sm:w-24"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Kurs kategoriyasi" className="h-9 max-w-full rounded-md border bg-background px-3 text-sm" value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setPage(1); }}><option value="">Barcha kategoriyalar</option>{categories.map(name => <option key={name} value={name}>{name}</option>)}</select>
            <select aria-label="Kurslarni tartiblash" className="h-9 max-w-full rounded-md border bg-background px-3 text-sm" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="title">Nomi: A–Z</option><option value="title-desc">Nomi: Z–A</option></select>
            {(search || statusFilter !== 'all' || categoryFilter) && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter(''); setPage(1); }}>Filtrlarni tozalash</Button>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="pl-5">Kurs</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="hidden 2xl:table-cell">Kategoriya</TableHead>
              <TableHead>Fan guruhi</TableHead>
              <TableHead className="hidden xl:table-cell">Til / daraja</TableHead>
              <TableHead className="sticky right-0 z-10 bg-card pr-5 text-right">Amallar</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visible.length === 0 && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">{courses.length === 0 ? "Hali kurs yaratilmagan. Yangi kurs yaratishdan boshlang." : 'Tanlangan filtrlar bo‘yicha kurs topilmadi.'}</TableCell></TableRow>}
              {visible.map((course) => {
                const meta = STATUS_META[course.status] ?? STATUS_META.draft;
                return <TableRow key={course.id}>
                  <TableCell className="min-w-56 pl-5">
                    <button className="flex items-center gap-3 text-left" onClick={() => navigate(`/teacher/courses/${course.id}/contents`)}>
                      <span className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-4 w-4 text-primary" /></span>
                      <span><span className="block font-medium">{course.title}</span><span className="block max-w-56 truncate text-xs text-muted-foreground">{course.shortDescription || course.subjectName || "—"}</span></span>
                    </button>
                  </TableCell>
                  <TableCell><Badge className={meta.className}>{meta.label}</Badge></TableCell>
                  <TableCell className="hidden 2xl:table-cell">{course.categoryName || "—"}</TableCell>
                  <TableCell><span className="block max-w-44 truncate" title={course.subjectName || undefined}>{course.subjectName || "—"}</span><span className="block max-w-44 truncate text-xs text-muted-foreground" title={course.groupName || undefined}>{course.groupName || "—"}</span></TableCell>
                  <TableCell className="hidden xl:table-cell">{(course.language || "—").toUpperCase()} · {levelLabel(course.level)}</TableCell>
                  <TableCell className="sticky right-0 z-10 bg-card pr-5"><div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/courses/${course.id}/contents`)}>Darslar</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`${course.title}: amallar`} disabled={actionMutation.isPending}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-56">
                        <DropdownMenuItem onSelect={() => navigate(`/teacher/courses/${course.id}`)}><Edit />Kurs ma'lumotlari</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void runAction({ course, action: 'copy' })}><Copy />Nusxa olish</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {course.status === 'draft' && <DropdownMenuItem onSelect={() => void runAction({ course, action: 'PUBLISHED' })}><Upload />Nashr qilish</DropdownMenuItem>}
                        {course.status !== 'draft' && <DropdownMenuItem onSelect={() => void runAction({ course, action: 'DRAFT' })}><Undo2 />Qoralamaga qaytarish</DropdownMenuItem>}
                        {course.status !== 'archived' && <DropdownMenuItem onSelect={() => askConfirmation({ course, action: 'ARCHIVED' })}><Archive />Arxivlash</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={course.status === 'published'} className="text-destructive focus:text-destructive" onSelect={() => askConfirmation({ course, action: 'delete' })}><Trash2 />Kursni o'chirish</DropdownMenuItem>
                        {course.status === 'published' && <p className="px-2 py-1 text-xs text-muted-foreground">O'chirishdan oldin kursni arxivlang.</p>}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
      <AlertDialog open={Boolean(confirmation)} onOpenChange={open => { if (!open && !actionLock.current) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirmation?.action === 'delete' ? "Kursni o'chirish" : 'Kursni arxivlash'}</AlertDialogTitle><AlertDialogDescription>
            «{confirmation?.course.title}» {confirmation?.action === 'delete' ? "kursi ro'yxatdan olib tashlanadi. Bu oynada uni qayta tiklash amali mavjud emas." : "kursi arxivga o'tadi. Keyin uni qoralamaga qaytarishingiz mumkin."}
          </AlertDialogDescription></AlertDialogHeader>
          {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
          <AlertDialogFooter><AlertDialogCancel disabled={actionMutation.isPending}>Bekor qilish</AlertDialogCancel><AlertDialogAction variant={confirmation?.action === 'delete' ? 'destructive' : 'default'} disabled={actionMutation.isPending} onClick={event => { event.preventDefault(); if (confirmation) void runAction(confirmation); }}>{actionMutation.isPending ? 'Bajarilmoqda…' : confirmation?.action === 'delete' ? "O'chirish" : 'Arxivlash'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function levelLabel(value?: string | null) {
  if (value === "BEGINNER") return "Boshlang'ich";
  if (value === "INTERMEDIATE") return "O'rta";
  if (value === "ADVANCED") return "Yuqori";
  return value || "—";
}
