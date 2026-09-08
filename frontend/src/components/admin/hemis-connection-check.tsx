import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hemisSyncApi } from '@/services/api/hemis-sync-api';

const fieldLabels: Record<string, string> = {
  HEMIS_HOST: 'HEMIS server manzili', HEMIS_API_BASE_PATH: 'API yo‘li',
  HEMIS_API_TOKEN: 'HEMIS API tokeni',
};

export function HemisConnectionCheck({ canManage }: { canManage: boolean }) {
  const configuration = useQuery({ queryKey: ['hemis-sync', 'connection'], queryFn: hemisSyncApi.connection });
  const check = useMutation({ mutationFn: hemisSyncApi.checkConnection });
  const result = check.data ?? configuration.data;

  return <section aria-label="HEMIS ulanishi" className="mb-4 space-y-3 rounded border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-semibold">1. Ulanishni tekshirish</h3>
        <p className="text-sm text-muted-foreground">Server sozlamalarini tekshiring, so‘ng guruhlarni yuklab, LMS guruhlariga moslashtiring.</p></div>
      <Button variant="outline" disabled={!canManage || check.isPending || configuration.isPending || configuration.isError}
        onClick={() => check.mutate()}>
        {check.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ulanishni tekshirish
      </Button>
    </div>
    {configuration.isPending && <p className="text-sm">Ulanish sozlamalari yuklanmoqda...</p>}
    {configuration.isError && <div role="alert" className="text-sm text-destructive">
      Sozlamalarni yuklab bo‘lmadi. <Button variant="link" onClick={() => void configuration.refetch()}>Qayta urinish</Button>
    </div>}
    {result && <>
      <p className="break-all text-sm">HEMIS manzili: <strong>{result.host ?? 'Sozlanmagan'}</strong></p>
      <div role="status" className={`rounded p-3 text-sm ${result.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : 'bg-muted'}`}>
        <p>{result.message}</p>
        {result.missingFields.length > 0 && <p className="mt-1">Sozlanishi kerak: {result.missingFields.map(field => fieldLabels[field] ?? field).join(', ')}. Bularni server administratori kiritadi.</p>}
        {result.status === 'CONNECTED' && result.groupsTotal != null && <p className="mt-1">HEMIS qaytargan guruhlar soni: {result.groupsTotal}.</p>}
        {result.checkedAt && <p className="mt-1">Tekshirildi: {new Date(result.checkedAt).toLocaleString('uz-UZ')}</p>}
      </div>
    </>}
    {check.isError && <p role="alert" className="text-sm text-destructive">Ulanishni tekshirib bo‘lmadi. Qayta urinib ko‘ring.</p>}
    <p className="text-xs text-muted-foreground">Bu tekshiruv talabalarni import qilmaydi. HEMIS orqali kirish va baholarni yuborish alohida sozlanadi.</p>
  </section>;
}
