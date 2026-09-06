import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { workspaceApi, type WorkspaceItem } from '@/services/api/workspace-api';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TodayTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('today');
  const [limit, setLimit] = useState(8);
  const query = useQuery({ queryKey: ['workspace', user?.id, 'tasks'], queryFn: workspaceApi.tasks, refetchInterval: 60_000 });
  const day = (value: string | number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
  const today = day(Date.now());
  const overdue = (item: WorkspaceItem) => ['Topshiriq', 'Test'].includes(item.kind) && !!item.dueAt && new Date(item.dueAt).getTime() < Date.now();
  const rows = (query.data ?? []).filter(item => !item.dueAt || filter === 'week' || (filter === 'overdue' ? overdue(item) : day(item.dueAt) <= today));
  return <Card><CardHeader><CardTitle>Bugungi ishlar</CardTitle><div className="flex flex-wrap gap-2">{[['today', 'Bugun'], ['overdue', 'Muddati o‘tgan'], ['week', 'Yaqin 7 kun']].map(([key, title]) => <Button key={key} size="sm" variant={filter === key ? 'default' : 'outline'} onClick={() => { setFilter(key); setLimit(8); }}>{title}</Button>)}</div></CardHeader><CardContent className="space-y-2">
    {query.isLoading ? <p role="status">Yuklanmoqda…</p> : query.isError ? <div role="alert">Ishlar ro'yxati yuklanmadi. <Button variant="link" onClick={() => query.refetch()}>Qayta urinish</Button></div> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Bu davr uchun bajariladigan ish yo'q.</p> : rows.slice(0, limit).map(item => <button key={item.id} onClick={() => navigate(item.url)} className="flex w-full items-center justify-between gap-3 rounded border p-3 text-left hover:bg-muted"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.detail}{item.dueAt && ` · ${new Date(item.dueAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}</p></div><Badge variant={overdue(item) ? 'destructive' : 'secondary'}>{item.kind}</Badge></button>)}
    {rows.length > limit && <Button variant="outline" onClick={() => setLimit(value => value + 10)}>Yana ko'rsatish ({rows.length - limit})</Button>}
  </CardContent></Card>;
}

export function SetupChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['workspace', user?.id, 'setup'], queryFn: workspaceApi.setup });
  return <Card><CardHeader><CardTitle>Dastlabki sozlash</CardTitle></CardHeader><CardContent className="space-y-2">
    {query.isLoading ? <p>Tekshirilmoqda…</p> : query.isError ? <div>Sozlash holati yuklanmadi. <Button variant="link" onClick={() => query.refetch()}>Qayta urinish</Button></div> : <><p className="text-sm text-muted-foreground">{query.data?.filter(step => step.done).length}/{query.data?.length} qadam bajarilgan</p>{query.data?.map(step => <button key={step.title} className="flex w-full items-center gap-3 rounded border p-3 text-left hover:bg-muted" onClick={() => navigate(step.url)}><span aria-label={step.done ? 'Bajarilgan' : 'Kutilmoqda'}>{step.done ? '✓' : '○'}</span>{step.title}</button>)}</>}
  </CardContent></Card>;
}
