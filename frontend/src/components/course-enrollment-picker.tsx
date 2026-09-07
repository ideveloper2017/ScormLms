import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherPortalApi } from '@/services/api/teacher-portal-api';

export function CourseEnrollmentPicker({ courseId, actorId, selected, onChange, disabled }: {
  courseId: string; actorId: number | null | undefined; selected: number[]; onChange: (ids: number[]) => void; disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [group, setGroup] = useState('');
  const [page, setPage] = useState(0);
  const [names, setNames] = useState<Record<number, string>>({});
  useEffect(() => { const timer = window.setTimeout(() => { setTerm(search.trim()); setPage(0); }, 300); return () => window.clearTimeout(timer); }, [search]);
  const query = useQuery({ queryKey: ['teacher', 'course', courseId, 'candidates', actorId, term, group, page],
    queryFn: () => teacherPortalApi.getEnrollmentCandidates(courseId, term, group, page), enabled: !!courseId && !disabled });
  const data = query.data;
  useEffect(() => { if (data) setNames(current => ({ ...current, ...Object.fromEntries(data.items.map(item => [item.id, item.fullName])) })); }, [data]);
  const eligible = data?.items.filter(item => item.eligible).map(item => item.id) ?? [];
  return <div className="w-full space-y-3">
    <div className="flex flex-wrap gap-2"><Input className="flex-1 min-w-48" value={search} onChange={e => setSearch(e.target.value)} disabled={disabled} aria-label="Talaba qidirish" placeholder="Ism, talaba raqami yoki guruh..." />
      <select className="h-10 max-w-full rounded-md border bg-background px-3" value={group} onChange={e => { setGroup(e.target.value); setPage(0); }} disabled={disabled} aria-label="Talaba guruhi"><option value="">Barcha guruhlar</option>{data?.groups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <div className="flex flex-wrap gap-2 items-center text-sm"><strong>{selected.length} talaba tanlandi</strong><Button type="button" variant="ghost" size="sm" disabled={disabled || !eligible.length || query.isFetching} onClick={() => onChange([...new Set([...selected, ...eligible])].slice(0, 500))}>Sahifadagilarni tanlash</Button><Button type="button" variant="ghost" size="sm" disabled={disabled || !selected.length} onClick={() => onChange([])}>Tanlovni tozalash</Button></div>
    {selected.length > 0 && <div className="flex flex-wrap gap-2">{selected.map(id => <Button type="button" key={id} size="sm" variant="secondary" disabled={disabled} aria-label={`${names[id] ?? id} tanlovini bekor qilish`} onClick={() => onChange(selected.filter(value => value !== id))}>{names[id] ?? id} ×</Button>)}</div>}
    {query.isLoading ? <p role="status">Talabalar yuklanmoqda...</p> : query.isError ? <div role="alert"><p>Talabalarni yuklab bo'lmadi.</p><Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>Qayta urinish</Button></div> : <>
      {data?.items.length === 0 && <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">Mos talaba topilmadi. Kurs fanga bog'langanini va talaba shu dasturda faol ekanini tekshiring. Avval biriktirilgan talabalar bu ro'yxatda chiqmaydi.</p>}
      <div className="max-h-72 overflow-y-auto divide-y rounded-md border">{data?.items.map(item => <label key={item.id} className="flex gap-3 items-start p-3 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4" aria-label={`${item.fullName}ni tanlash`} checked={selected.includes(item.id)} disabled={disabled || !item.eligible || (!selected.includes(item.id) && selected.length >= 500)} onChange={e => onChange(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))} />
        <span><span className="font-medium">{item.fullName}</span><span className="block text-muted-foreground">{item.studentNumber} · {item.groupName ?? 'Guruh belgilanmagan'}</span>{item.reason && <span className="block text-amber-700 dark:text-amber-400">{item.reason}</span>}</span>
      </label>)}</div>
      {data && <div className="flex justify-between gap-2 items-center text-sm"><span>{data.total} nomzod · {page + 1}-sahifa</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={!page || query.isFetching} onClick={() => setPage(page - 1)}>Oldingi</Button><Button type="button" variant="outline" size="sm" disabled={!data.hasNext || query.isFetching} onClick={() => setPage(page + 1)}>Keyingi</Button></div></div>}
    </>}
  </div>;
}
