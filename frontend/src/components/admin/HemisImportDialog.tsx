import { useState } from 'react';
import { CheckCircle2, DatabaseZap, Loader2, RefreshCw, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { hemisApi, type HemisGroup, type HemisStudentPreview } from '@/services/api/hemis-api';
import { hemisSyncApi, type HemisSyncRun } from '@/services/api/hemis-sync-api';

type Step = 'group' | 'preview' | 'result';
interface Props { open: boolean; onOpenChange: (open: boolean) => void; onImported?: () => void }

export function HemisImportDialog({ open, onOpenChange, onImported }: Props) {
  const [step, setStep] = useState<Step>('group');
  const [groups, setGroups] = useState<HemisGroup[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<HemisGroup | null>(null);
  const [students, setStudents] = useState<HemisStudentPreview[]>([]);
  const [run, setRun] = useState<HemisSyncRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => perform(async () => {
    setGroups(await hemisApi.getGroups());
    setStep('group');
  }, 'Guruhlarni yuklab bo‘lmadi');

  const loadStudents = async (group: HemisGroup) => perform(async () => {
    setSelectedGroup(group);
    setStudents(await hemisApi.previewStudents(group.id));
    setStep('preview');
  }, 'Talabalarni yuklab bo‘lmadi');

  const startSync = async () => {
    if (!selectedGroup) return;
    await perform(async () => {
      const created = await hemisSyncApi.start(selectedGroup.id);
      setRun(created);
      setStep('result');
      toast.success(`HEMIS sync #${created.id} ishga tushirildi`);
      onImported?.();
    }, 'Sinxronlashni boshlab bo‘lmadi');
  };

  async function perform(action: () => Promise<void>, fallback: string) {
    setLoading(true); setError(null);
    try { await action(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : fallback); }
    finally { setLoading(false); }
  }

  const reset = () => {
    setStep('group'); setGroups([]); setSearch(''); setSelectedGroup(null);
    setStudents([]); setRun(null); setError(null);
  };
  const close = (value: boolean) => { if (!value) reset(); onOpenChange(value); };
  const filteredGroups = groups.filter(group => group.name.toLowerCase().includes(search.toLowerCase()));
  const existing = students.filter(student => student.alreadyExists).length;

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><DatabaseZap className="h-5 w-5 text-blue-600" />HEMIS talabalarini sinxronlash</DialogTitle><DialogDescription>
        {step === 'group' && 'HEMIS guruhini tanlang.'}
        {step === 'preview' && `${selectedGroup?.name} guruhining to‘liq va auditli sinxronlashini tasdiqlang.`}
        {step === 'result' && 'Run fon rejimida bajariladi; holat Integratsiyalar ekranida kuzatiladi.'}
      </DialogDescription></DialogHeader>

      {error && <div className="rounded border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}

      {step === 'group' && <div className="min-h-0 flex-1 space-y-3">
        {groups.length === 0 ? <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground"><Users className="h-12 w-12 opacity-20" /><p className="text-sm">HEMIS guruhlarini yuklang</p><Button onClick={loadGroups} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Yuklash</Button></div> : <>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Guruh nomi bo‘yicha qidiring" /></div>
          <ScrollArea className="h-72 rounded border"><div className="divide-y">{filteredGroups.map(group => <button key={group.id} onClick={() => loadStudents(group)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/60"><strong>{group.name}</strong>{group.studentsCount != null && <Badge variant="secondary">{group.studentsCount} talaba</Badge>}</button>)}</div></ScrollArea>
        </>}
      </div>}

      {step === 'preview' && <div className="min-h-0 flex-1 space-y-3">
        <div className="flex flex-wrap gap-2 text-sm"><Badge variant="outline">{students.length} jami</Badge><Badge variant="secondary">{existing} lokal bazada bor</Badge><span className="text-muted-foreground">Barcha yozuvlar create/update/unchanged/conflict qoidalari bilan tekshiriladi.</span></div>
        <ScrollArea className="h-72 rounded border"><div className="divide-y">{students.map(student => <div key={student.hemisId} className="flex items-start gap-3 px-4 py-3"><CheckCircle2 className={`mt-0.5 h-4 w-4 ${student.alreadyExists ? 'text-muted-foreground' : 'text-primary'}`} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="text-sm">{student.fullName}</strong>{student.alreadyExists && <Badge variant="secondary">Mavjud</Badge>}</div><p className="text-xs text-muted-foreground">{student.studentNumber} · {student.group} · {student.educationLang}</p></div></div>)}</div></ScrollArea>
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs dark:bg-amber-950/20">Guruh mappingi, PINFL, jins yoki identity mos kelmasa profil taxminiy qiymat bilan yozilmaydi; konflikt Integratsiyalar ekraniga tushadi.</div>
      </div>}

      {step === 'result' && run && <div className="space-y-3 py-6 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h3 className="font-semibold">Sync run #{run.id} yaratildi</h3><Badge variant="secondary">{run.status}</Badge><p className="text-sm text-muted-foreground">Natija, checkpoint va konfliktlarni Admin → Integratsiyalar bo‘limida kuzating.</p></div>}

      <DialogFooter className="gap-2">
        {step === 'preview' && <><Button variant="outline" onClick={() => setStep('group')}>Orqaga</Button><Button onClick={startSync} disabled={loading || students.length === 0}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guruhni sinxronlash</Button></>}
        {step === 'result' && <><Button variant="outline" onClick={reset}>Yana sinxronlash</Button><Button onClick={() => close(false)}>Yopish</Button></>}
        {step !== 'result' && <Button variant="ghost" onClick={() => close(false)} disabled={loading}>Bekor qilish</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
