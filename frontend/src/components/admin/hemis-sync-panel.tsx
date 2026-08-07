import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, DatabaseZap, Loader2, Play, RefreshCw, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { hemisSyncApi, type HemisConflict, type HemisRunStatus } from '@/services/api/hemis-sync-api';

const runVariant: Record<HemisRunStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  QUEUED: 'secondary', RUNNING: 'outline', COMPLETED: 'default', PARTIAL: 'secondary', FAILED: 'destructive',
};

export function HemisSyncPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedConflict, setSelectedConflict] = useState<HemisConflict | null>(null);
  const [note, setNote] = useState('');
  const overview = useQuery({ queryKey: ['hemis-sync', 'overview'], queryFn: hemisSyncApi.overview, refetchInterval: 10_000 });
  const runs = useQuery({ queryKey: ['hemis-sync', 'runs'], queryFn: hemisSyncApi.runs, refetchInterval: 10_000 });
  const mappings = useQuery({ queryKey: ['hemis-sync', 'mappings'], queryFn: hemisSyncApi.mappings });
  const localGroups = useQuery({ queryKey: ['hemis-sync', 'local-groups'], queryFn: hemisSyncApi.localGroups });
  const conflicts = useQuery({ queryKey: ['hemis-sync', 'conflicts'], queryFn: hemisSyncApi.conflicts });

  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['hemis-sync'] });
  const mutation = useMutation({
    mutationFn: hemisSyncApi.start,
    onSuccess: async run => { await refresh(); toast({ title: `HEMIS sync #${run.id} ishga tushirildi` }); },
    onError: (error: Error) => toast({ title: 'Sinxronlash boshlanmadi', description: error.message, variant: 'destructive' }),
  });
  const refreshRemote = useMutation({
    mutationFn: hemisSyncApi.refreshMappings,
    onSuccess: async () => { await refresh(); toast({ title: 'HEMIS guruhlari yangilandi' }); },
    onError: (error: Error) => toast({ title: 'Guruhlar yangilanmadi', description: error.message, variant: 'destructive' }),
  });
  const saveMapping = useMutation({
    mutationFn: ({ hemisId, localId }: { hemisId: number; localId: number | null }) => hemisSyncApi.updateMapping(hemisId, localId),
    onSuccess: refresh,
    onError: (error: Error) => toast({ title: 'Mapping saqlanmadi', description: error.message, variant: 'destructive' }),
  });
  const resume = useMutation({ mutationFn: hemisSyncApi.resume, onSuccess: refresh });
  const resolve = useMutation({
    mutationFn: () => hemisSyncApi.resolveConflict(selectedConflict!.id, note),
    onSuccess: async () => { setSelectedConflict(null); setNote(''); await refresh(); toast({ title: 'Konflikt audit izohi bilan yopildi' }); },
    onError: (error: Error) => toast({ title: 'Konflikt yopilmadi', description: error.message, variant: 'destructive' }),
  });

  const state = overview.data;
  return <Card>
    <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div><CardTitle className="flex items-center gap-2"><DatabaseZap className="h-5 w-5" />HEMIS davriy sinxronlash</CardTitle><CardDescription>Checkpoint, idempotent yangilash, guruh mappingi va maskalangan konfliktlar.</CardDescription></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!state?.canManage || refreshRemote.isPending} onClick={() => refreshRemote.mutate()}><RefreshCw className="mr-2 h-4 w-4" />Guruhlarni olish</Button>
        <Button disabled={!state?.canManage || !state.credentialsConfigured || !!state.currentRun || mutation.isPending} onClick={() => mutation.mutate(undefined)}><Play className="mr-2 h-4 w-4" />Sync boshlash</Button>
      </div>
    </CardHeader>
    <CardContent>
      {(overview.isLoading || runs.isLoading) && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
      {overview.error && <p className="rounded border border-destructive/30 p-3 text-sm text-destructive">{overview.error.message}</p>}
      {state && <>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Credential" value={state.credentialsConfigured ? 'Sozlangan' : 'Sozlanmagan'} good={state.credentialsConfigured} />
          <Stat label="Davriy ish" value={state.periodicEnabled ? 'Faol' : 'O‘chiq'} good={state.periodicEnabled} />
          <Stat label="Tayyor mapping" value={`${state.mappingsReady}/${state.mappingsTotal}`} good={state.mappingsTotal > 0 && state.mappingsReady === state.mappingsTotal} />
          <Stat label="Ochiq konflikt" value={String(state.openConflicts)} good={state.openConflicts === 0} />
        </div>
        {!state.credentialsConfigured && <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">HEMIS_ADMIN_LOGIN va HEMIS_ADMIN_PASSWORD sozlanmaguncha real sinxronlash boshlanmaydi.</div>}
      </>}

      <Tabs defaultValue="runs">
        <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="runs">Runlar</TabsTrigger><TabsTrigger value="mappings">Guruh mappingi</TabsTrigger><TabsTrigger value="conflicts">Konfliktlar</TabsTrigger></TabsList>
        <TabsContent value="runs" className="space-y-2 pt-3">
          {runs.data?.map(run => <div key={run.id} className="grid gap-2 rounded border p-3 text-sm lg:grid-cols-[90px_120px_1fr_auto] lg:items-center">
            <strong>#{run.id}</strong><Badge variant={runVariant[run.status]} className="w-fit">{run.status}</Badge>
            <span className="text-muted-foreground">Ko‘rildi {run.recordsSeen} · yangi {run.created} · yangilandi {run.updated} · konflikt {run.conflicts} · xato {run.errors}</span>
            {run.canResume && state?.canManage && <Button size="sm" variant="outline" disabled={resume.isPending} onClick={() => resume.mutate(run.id)}><RotateCcw className="mr-2 h-3 w-3" />Davom ettirish</Button>}
          </div>)}
          {runs.data?.length === 0 && <Empty text="Hali sync run mavjud emas." />}
        </TabsContent>
        <TabsContent value="mappings" className="space-y-2 pt-3">
          {mappings.data?.map(mapping => <div key={mapping.hemisGroupId} className="grid gap-2 rounded border p-3 text-sm lg:grid-cols-[1fr_1.3fr] lg:items-center">
            <div><strong>{mapping.hemisGroupName}</strong><div className="text-xs text-muted-foreground">HEMIS #{mapping.hemisGroupId}</div></div>
            <Select disabled={!state?.canManage || saveMapping.isPending} value={mapping.localGroupId?.toString() ?? 'NONE'} onValueChange={value => saveMapping.mutate({ hemisId: mapping.hemisGroupId, localId: value === 'NONE' ? null : Number(value) })}>
              <SelectTrigger><SelectValue placeholder="Lokal guruhni tanlang" /></SelectTrigger>
              <SelectContent><SelectItem value="NONE">Mapping yo‘q</SelectItem>{localGroups.data?.map(group => <SelectItem key={group.id} value={String(group.id)}>{group.name}{group.programName ? ` — ${group.programName}` : ''}</SelectItem>)}</SelectContent>
            </Select>
          </div>)}
          {mappings.data?.length === 0 && <Empty text="Avval HEMIS guruhlarini yuklang." />}
        </TabsContent>
        <TabsContent value="conflicts" className="space-y-2 pt-3">
          {conflicts.data?.map(conflict => <div key={conflict.id} className="grid gap-2 rounded border p-3 text-sm lg:grid-cols-[1fr_1fr_auto] lg:items-center">
            <div><strong>{conflict.code}</strong><div className="text-xs text-muted-foreground">{conflict.studentNumberMasked} · run #{conflict.runId}</div></div>
            <div className="text-xs text-muted-foreground">{conflict.fieldName ?? 'manba'}: {conflict.localValueMasked ?? '—'} → {conflict.sourceValueMasked ?? '—'}</div>
            {conflict.canResolve ? <Button size="sm" variant="outline" onClick={() => { setSelectedConflict(conflict); setNote(''); }}>Ko‘rib chiqildi</Button> : <Badge variant="secondary">{conflict.status}</Badge>}
          </div>)}
          {conflicts.data?.length === 0 && <Empty text="Konflikt mavjud emas." />}
        </TabsContent>
      </Tabs>
    </CardContent>

    <Dialog open={selectedConflict !== null} onOpenChange={open => { if (!open) setSelectedConflict(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Konfliktni yopish</DialogTitle><DialogDescription>Bu amal ma’lumotni avtomatik almashtirmaydi. HEMIS yoki lokal yozuv tuzatilgach, kamida 10 belgili audit izohini kiriting.</DialogDescription></DialogHeader><Textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Qanday tekshirildi va qayerda tuzatildi?" /><DialogFooter><Button disabled={note.trim().length < 10 || resolve.isPending} onClick={() => resolve.mutate()}>{resolve.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Yopish</Button></DialogFooter></DialogContent>
    </Dialog>
  </Card>;
}

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return <div className="flex items-center gap-3 rounded border p-3">{good ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}<div><div className="font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div></div>;
}
function Empty({ text }: { text: string }) { return <div className="py-8 text-center text-sm text-muted-foreground">{text}</div>; }
