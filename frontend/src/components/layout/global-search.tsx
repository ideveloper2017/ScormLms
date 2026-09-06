import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { workspaceApi } from '@/services/api/workspace-api';
import { buildNav } from './app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => { const timer = setTimeout(() => setQuery(term.trim()), 300); return () => clearTimeout(timer); }, [term]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(value => !value); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const results = useQuery({ queryKey: ['workspace', user?.id, 'search', query], queryFn: () => workspaceApi.search(query), enabled: open && query.length >= 2 });
  const pages = buildNav(user?.role?.name || user?.roles?.[0]?.name || '').flatMap(group => [
    ...(group.href ? [{ name: group.label, href: group.href }] : []), ...group.items,
  ]).filter((page, index, all) => all.findIndex(other => other.href === page.href) === index && page.name.toLowerCase().includes(term.toLowerCase())).slice(0, 6);
  const go = (url: string) => { setOpen(false); navigate(url); };
  return <>
    <Button variant="outline" onClick={() => setOpen(true)} aria-label="Umumiy qidiruv" className="gap-2 text-muted-foreground"><Search className="h-4 w-4" /><span className="hidden md:inline">Kurs, talaba yoki sahifa qidirish</span><kbd className="hidden lg:inline text-xs">Ctrl K</kbd></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Qidiruv</DialogTitle><DialogDescription>Vakolatingiz doirasidagi kurslar, talabalar va sahifalar.</DialogDescription></DialogHeader>
      <Input autoFocus aria-label="Qidiruv matni" placeholder="Kamida 2 ta belgi kiriting…" value={term} maxLength={100} onChange={event => setTerm(event.target.value)} />
      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {pages.map(page => <button className="block w-full rounded border p-3 text-left hover:bg-muted" key={page.href} onClick={() => go(page.href)}><span className="text-xs text-muted-foreground">Sahifa</span><p>{page.name}</p></button>)}
        {query.length >= 2 && (results.isFetching || term.trim() !== query) ? <p role="status">Qidirilmoqda…</p> : results.isError ? <div role="alert">Qidiruv yuklanmadi. <Button variant="link" onClick={() => results.refetch()}>Qayta urinish</Button></div> : results.data?.map(item => <button className="block w-full rounded border p-3 text-left hover:bg-muted" key={item.id} onClick={() => go(item.url)}><span className="text-xs text-muted-foreground">{item.kind} · {item.detail}</span><p>{item.title}</p></button>)}
        {query.length >= 2 && !results.isFetching && !results.isError && results.data?.length === 0 && pages.length === 0 && <p>Natija topilmadi.</p>}
      </div>
    </DialogContent></Dialog>
  </>;
}
