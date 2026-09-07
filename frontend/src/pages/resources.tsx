import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { resourcesApi, type Resource } from '@/services/api/resources-api';
import { teacherPortalApi } from '@/services/api/teacher-portal-api';
import { hasAuthority } from '@/lib/rbac-api';

const labels: Record<Resource['type'], string> = { pdf: 'PDF', video: 'Video', link: 'Havola', document: 'Hujjat', image: 'Rasm', archive: 'Arxiv', text: 'Matnli dars' };
export function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const student = user?.role?.name.replace(/^ROLE_/i, '').toLowerCase() === 'student';
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [course, setCourse] = useState('all');
  const [pending, setPending] = useState<string>();
  const query = useQuery({ queryKey: ['resources', 'list', user?.id, student], queryFn: () => resourcesApi.getResources(undefined, student) });
  const resources = query.data ?? [];
  const courses = [...new Map(resources.map(item => [item.courseId, item.course ?? 'Kurs'])).entries()];
  const filtered = resources.filter(item => (type === 'all' || item.type === type) && (course === 'all' || item.courseId === course) &&
    `${item.title} ${item.description ?? ''} ${item.course ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  async function download(item: Resource) {
    if (!item.courseId || !item.contentId || !item.fileName) return;
    setPending(item.id);
    try {
      const blob = await teacherPortalApi.downloadContentFile(item.courseId, item.contentId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = item.fileName;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: 'Fayl yuklab olindi' });
    } catch { toast({ title: "Faylni yuklab bo'lmadi", description: "Ruxsat yoki material holati o'zgargan bo'lishi mumkin. Sahifani yangilang.", variant: 'destructive' }); }
    finally { setPending(undefined); }
  }
  return <div className="p-3 sm:p-6 space-y-6">
    <div className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="text-2xl font-bold">O'quv resurslari</h1><p className="text-muted-foreground">{student ? 'Sizga ochiq kurslarning materiallari bir joyda' : 'Boshqarishingiz mumkin bo‘lgan kurslarning materiallari'}</p></div>
      {!student && hasAuthority(user, 'COURSE_WRITE') && <Button asChild variant="outline"><Link to="/teacher/courses">Kursda material qo'shish</Link></Button>}
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
      <Input className="flex-1 min-w-48" aria-label="Resurs qidirish" placeholder="Material yoki kurs nomi..." value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Resurs turi" className="h-10 rounded-md border bg-background px-3" value={type} onChange={e => setType(e.target.value)}><option value="all">Barcha turlar</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Kurs" className="h-10 max-w-full rounded-md border bg-background px-3" value={course} onChange={e => setCourse(e.target.value)}><option value="all">Barcha kurslar</option>{courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select>
    </div>
    {query.isLoading ? <p role="status">Materiallar yuklanmoqda...</p> : query.isError ? <div role="alert" className="rounded-lg border p-6 space-y-3"><p>Materiallarni yuklab bo'lmadi.</p><Button variant="outline" onClick={() => void query.refetch()}>Qayta urinish</Button></div> : <>
      <p className="text-sm text-muted-foreground">{filtered.length} ta material · jami {resources.length}</p>
      {filtered.length === 0 && <Card><CardContent className="py-10 text-center space-y-3"><BookOpen className="mx-auto text-muted-foreground" /><p>{resources.length ? "Bu filtr bo'yicha material topilmadi." : "Hozircha sizga ochiq material yo'q."}</p>{resources.length > 0 && <Button variant="outline" onClick={() => { setSearch(''); setType('all'); setCourse('all'); }}>Filtrlarni tozalash</Button>}</CardContent></Card>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(item => <Card key={item.id} className="flex flex-col"><CardHeader><div className="flex justify-between gap-3"><Badge variant="secondary">{labels[item.type]}</Badge>{item.size != null && <span className="text-xs text-muted-foreground">{(item.size / 1024).toFixed(1)} KB</span>}</div><CardTitle className="text-base leading-relaxed">{item.title}</CardTitle><CardDescription>{item.course}</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col justify-between gap-4"><p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p><div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link to={item.url}><BookOpen className="mr-2 h-4 w-4" />Darsni ochish</Link></Button>
        {item.fileName && <Button size="sm" disabled={!!pending} onClick={() => void download(item)}>{pending === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Yuklab olish</Button>}
        {item.externalUrl && /^https?:\/\//i.test(item.externalUrl) && <Button asChild variant="ghost" size="sm"><a href={item.externalUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Havolani ochish</a></Button>}
      </div></CardContent></Card>)}</div>
    </>}
  </div>;
}
