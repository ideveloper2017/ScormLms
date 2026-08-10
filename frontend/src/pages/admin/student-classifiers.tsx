import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Database, ExternalLink, Plus, Pencil, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { hasAuthority } from '@/lib/rbac-api';
import { useToast } from '@/hooks/use-toast';
import {
  type ClassifierItem, type DistrictClassifierItem, listAdminCountries, listAdminDistricts, listAdminRegions,
  getClassifierImportStatus, importBundledClassifiers, saveCountry, saveDistrict, saveRegion,
} from '@/lib/classifier-api';

type Kind = 'country' | 'region' | 'district';
type Editable = ClassifierItem | DistrictClassifierItem;
const emptyForm = () => ({ code: '', name: '', active: true, sortOrder: 0, regionId: '' });

export function AdminStudentClassifiers() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, 'ACADEMIC_WRITE');
  const { toast } = useToast();
  const client = useQueryClient();
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [dialog, setDialog] = useState<{ kind: Kind; item: Editable | null } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const countries = useQuery({ queryKey: ['classifiers', 'admin', 'countries'], queryFn: listAdminCountries });
  const regions = useQuery({ queryKey: ['classifiers', 'admin', 'regions'], queryFn: listAdminRegions });
  const importStatus = useQuery({ queryKey: ['classifiers', 'admin', 'import-status'], queryFn: getClassifierImportStatus });
  const districts = useQuery({
    queryKey: ['classifiers', 'admin', 'districts', selectedRegionId],
    queryFn: () => listAdminDistricts(Number(selectedRegionId)), enabled: !!selectedRegionId,
  });

  const open = (kind: Kind, item: Editable | null = null) => {
    setDialog({ kind, item });
    setForm({
      code: item?.code ?? '', name: item?.name ?? '', active: item?.active ?? true,
      sortOrder: item?.sortOrder ?? 0,
      regionId: kind === 'district' ? String((item as DistrictClassifierItem | null)?.regionId ?? selectedRegionId) : '',
    });
  };
  const save = useMutation({
    mutationFn: async () => {
      if (!dialog) return;
      const base = { code: form.code.trim().toUpperCase(), name: form.name.trim(), active: form.active, sortOrder: Number(form.sortOrder) };
      if (dialog.kind === 'country') return saveCountry(dialog.item?.id ?? null, base);
      if (dialog.kind === 'region') return saveRegion(dialog.item?.id ?? null, base);
      return saveDistrict(dialog.item?.id ?? null, { ...base, regionId: Number(form.regionId) });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['classifiers'] }); setDialog(null);
      toast({ title: 'Klassifikator saqlandi' });
    },
    onError: (error) => toast({ title: 'Saqlash rad etildi', description: error instanceof Error ? error.message : 'Server xatosi', variant: 'destructive' }),
  });
  const importDataset = useMutation({
    mutationFn: importBundledClassifiers,
    onSuccess: async data => {
      client.setQueryData(['classifiers', 'admin', 'import-status'], data);
      await client.invalidateQueries({ queryKey: ['classifiers'], exact: false });
      toast({ title: 'Rasmiy klassifikator paketi import qilindi', description: `${data.countriesTotal} mamlakat, ${data.regionsTotal} hudud va ${data.districtsTotal} tuman/shahar.` });
    },
    onError: error => toast({ title: 'Import rad etildi', description: error instanceof Error ? error.message : 'Server xatosi', variant: 'destructive' }),
  });

  const list = (items: Editable[] | undefined, kind: Kind) => (
    <div className="divide-y rounded-md border">
      {(items ?? []).map(item => <div key={item.id} className="flex items-center gap-3 p-3">
        <span className="w-28 font-mono text-xs" title={item.sourceCode && item.sourceCode !== item.code ? `Ichki kod: ${item.code}` : undefined}>{item.sourceCode ?? item.code}</span><span className="flex-1">{item.name}</span>
        {item.managedSource && <Badge variant="outline">{item.managedSource === 'SOATO' ? 'SOATO' : 'ISO'}</Badge>}
        <Badge variant={item.active ? 'default' : 'secondary'}>{item.active ? 'Faol' : 'Nofaol'}</Badge>
        <span className="w-10 text-right text-xs text-muted-foreground">{item.sortOrder}</span>
        {canWrite && <Button size="icon" variant="ghost" onClick={() => open(kind, item)}><Pencil className="h-4 w-4" /></Button>}
      </div>)}
      {(items ?? []).length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Yozuv topilmadi</p>}
    </div>
  );
  const add = (kind: Kind, disabled = false) => canWrite && <Button disabled={disabled} onClick={() => open(kind)}><Plus className="mr-2 h-4 w-4" />Qo'shish</Button>;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Talaba klassifikatorlari</h1><p className="text-sm text-muted-foreground">Fuqarolik mamlakati, hudud va hududga bog'langan tumanlar. Nofaol yozuvlar yangi kartochkalarda ko'rinmaydi.</p></div>
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1"><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Rasmiy ma'lumotlar paketi</CardTitle><p className="text-sm text-muted-foreground">ISO 3166-1 mamlakat kodlari, CLDR o'zbekcha nomlari va MHOBT/SOATO hududlari.</p></div>
        <Badge variant={importStatus.data?.current ? 'default' : 'secondary'}>{importStatus.data?.current ? "Joriy paket o'rnatilgan" : 'Import talab qilinadi'}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {importStatus.isLoading && <p className="text-sm text-muted-foreground">Paket holati yuklanmoqda...</p>}
        {importStatus.isError && <p className="text-sm text-destructive">Paket holatini olib bo'lmadi.</p>}
        {importStatus.data && <>
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md border p-3"><p className="text-2xl font-semibold">{importStatus.data.countriesTotal}</p><p className="text-xs text-muted-foreground">mamlakat</p></div><div className="rounded-md border p-3"><p className="text-2xl font-semibold">{importStatus.data.regionsTotal}</p><p className="text-xs text-muted-foreground">hudud</p></div><div className="rounded-md border p-3"><p className="text-2xl font-semibold">{importStatus.data.districtsTotal}</p><p className="text-xs text-muted-foreground">tuman/shahar</p></div></div>
          <div className="space-y-1 text-xs text-muted-foreground"><p>Versiya: <span className="font-mono text-foreground">{importStatus.data.datasetVersion}</span></p><p>Manifest SHA-256: <span className="font-mono text-foreground">{importStatus.data.manifestSha256}</span></p></div>
          <div className="flex flex-wrap gap-2">{importStatus.data.sources.map(source => <Button key={source.url} variant="outline" size="sm" asChild><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink className="ml-2 h-3 w-3" /></a></Button>)}</div>
          {importStatus.data.lastRun && <p className="text-xs text-muted-foreground">Oxirgi import: {new Date(importStatus.data.lastRun.finishedAt ?? importStatus.data.lastRun.startedAt).toLocaleString()} · yaratildi {importStatus.data.lastRun.createdCount}, yangilandi {importStatus.data.lastRun.updatedCount}, o'zgarmadi {importStatus.data.lastRun.unchangedCount}, nofaol qilindi {importStatus.data.lastRun.deactivatedCount}.</p>}
        </>}
        {canWrite && <Button disabled={!importStatus.data || importDataset.isPending} onClick={() => importDataset.mutate()}><RefreshCw className={`mr-2 h-4 w-4 ${importDataset.isPending ? 'animate-spin' : ''}`} />{importStatus.data?.current ? 'Paketni qayta tekshirish' : 'Rasmiy paketni import qilish'}</Button>}
      </CardContent>
    </Card>
    <Tabs defaultValue="countries">
      <TabsList><TabsTrigger value="countries">Mamlakatlar</TabsTrigger><TabsTrigger value="regions">Hududlar</TabsTrigger><TabsTrigger value="districts">Tumanlar</TabsTrigger></TabsList>
      <TabsContent value="countries"><Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Fuqarolik mamlakatlari</CardTitle>{add('country')}</CardHeader><CardContent>{list(countries.data, 'country')}</CardContent></Card></TabsContent>
      <TabsContent value="regions"><Card><CardHeader className="flex-row items-center justify-between"><CardTitle>O'zbekiston hududlari</CardTitle>{add('region')}</CardHeader><CardContent>{list(regions.data, 'region')}</CardContent></Card></TabsContent>
      <TabsContent value="districts"><Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Tuman va shaharlar</CardTitle>{add('district', !selectedRegionId)}</CardHeader><CardContent className="space-y-4"><Select value={selectedRegionId} onValueChange={setSelectedRegionId}><SelectTrigger className="max-w-md"><SelectValue placeholder="Hududni tanlang" /></SelectTrigger><SelectContent>{(regions.data ?? []).map(region => <SelectItem key={region.id} value={String(region.id)}>{region.name}</SelectItem>)}</SelectContent></Select>{list(districts.data, 'district')}</CardContent></Card></TabsContent>
    </Tabs>
    <Dialog open={!!dialog} onOpenChange={value => { if (!value) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{dialog?.item ? 'Klassifikatorni tahrirlash' : 'Klassifikator qo\'shish'}</DialogTitle></DialogHeader><div className="space-y-4 py-2">
      {dialog?.kind === 'district' && <div className="space-y-2"><Label>Hudud *</Label><Select value={form.regionId} onValueChange={value => setForm({...form, regionId: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(regions.data ?? []).map(region => <SelectItem key={region.id} value={String(region.id)}>{region.name}</SelectItem>)}</SelectContent></Select></div>}
      <div className="space-y-2"><Label>Kod *</Label><Input value={form.code} maxLength={dialog?.kind === 'country' ? 2 : 30} onChange={event => setForm({...form, code: event.target.value.toUpperCase()})} /></div>
      <div className="space-y-2"><Label>Nomi *</Label><Input value={form.name} onChange={event => setForm({...form, name: event.target.value})} /></div>
      <div className="space-y-2"><Label>Tartib</Label><Input type="number" min={0} max={10000} value={form.sortOrder} onChange={event => setForm({...form, sortOrder: Number(event.target.value)})} /></div>
      <div className="flex items-center justify-between"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={active => setForm({...form, active})} /></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Bekor qilish</Button><Button disabled={!form.code.trim() || form.name.trim().length < 2 || (dialog?.kind === 'district' && !form.regionId) || save.isPending} onClick={() => save.mutate()}>Saqlash</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
