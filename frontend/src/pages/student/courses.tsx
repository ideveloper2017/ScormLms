import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, Play, RefreshCw, Search } from 'lucide-react';
import { useCourses } from '@/hooks/courses/useCourses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusLabel: Record<string, string> = { active: 'Faol', completed: 'Yakunlangan', draft: 'Qoralama' };

export function StudentCourses() {
  const navigate = useNavigate();
  const coursesQuery = useCourses();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const courses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('uz');
    return (coursesQuery.data ?? []).filter(course => {
      const matchesStatus = status === 'all' || course.status === status;
      const matchesSearch = !term || `${course.title} ${course.description} ${course.instructor}`.toLocaleLowerCase('uz').includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [coursesQuery.data, search, status]);

  const activeCount = (coursesQuery.data ?? []).filter(course => course.status === 'active').length;
  const completedCount = (coursesQuery.data ?? []).filter(course => course.status === 'completed').length;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div><h1 className="text-2xl font-bold">Mening kurslarim</h1><p className="mt-1 text-sm text-muted-foreground">Sizga biriktirilgan fanlar, materiallar va o‘zlashtirish holati</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><BookOpen className="h-6 w-6 text-primary" /><div><p className="text-2xl font-bold">{coursesQuery.data?.length ?? 0}</p><p className="text-sm text-muted-foreground">Jami kurs</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Play className="h-6 w-6 text-blue-600" /><div><p className="text-2xl font-bold">{activeCount}</p><p className="text-sm text-muted-foreground">Faol</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-6 w-6 text-emerald-600" /><div><p className="text-2xl font-bold">{completedCount}</p><p className="text-sm text-muted-foreground">Yakunlangan</p></div></CardContent></Card>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Kurs nomi yoki o‘qituvchi bo‘yicha qidiring" className="pl-9" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Barcha holatlar</SelectItem><SelectItem value="active">Faol</SelectItem><SelectItem value="completed">Yakunlangan</SelectItem></SelectContent></Select>
      </div>
      {coursesQuery.isLoading ? <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        : coursesQuery.isError ? <Card className="border-destructive/40"><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><AlertTriangle className="h-10 w-10 text-destructive" /><div><p className="font-medium">Kurslarni yuklab bo‘lmadi</p><p className="text-sm text-muted-foreground">Server bilan aloqani tekshirib qayta urinib ko‘ring.</p></div><Button onClick={() => coursesQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></CardContent></Card>
        : courses.length === 0 ? <Card><CardContent className="py-14 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">Kurs topilmadi</p><p className="mt-1 text-sm text-muted-foreground">Filtrni o‘zgartiring yoki administrator sizni kursga biriktirishini kuting.</p></CardContent></Card>
        : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map(course => <Card key={course.id} className="flex flex-col overflow-hidden"><div className="flex h-28 items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-background"><BookOpen className="h-10 w-10 text-primary" /></div><CardHeader className="pb-3"><div className="flex items-start justify-between gap-2"><CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle><Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>{statusLabel[course.status] ?? course.status}</Badge></div><CardDescription>{course.instructor || 'O‘qituvchi biriktirilmagan'}</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col"><p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{course.description || 'Kurs tavsifi kiritilmagan.'}</p><div className="mt-auto space-y-3"><div className="flex items-center justify-between text-sm"><span>O‘zlashtirish</span><span className="font-medium">{course.progress}%</span></div><Progress value={course.progress} className="h-2" /><Button className="w-full" onClick={() => navigate(`/student/courses/${course.id}/learn`)}><Play className="mr-2 h-4 w-4" />{course.progress > 0 ? 'Davom ettirish' : 'Kursni boshlash'}</Button></div></CardContent></Card>)}</div>}
    </div>
  );
}
