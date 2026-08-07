import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, CheckCircle2, ExternalLink, Loader2, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { announcementApi, type AnnouncementInboxItem } from '@/services/api/announcement-api';

const categoryLabels: Record<AnnouncementInboxItem['category'], string> = {
  INFORMATION: "Ma'lumot",
  DEADLINE: 'Muddat',
  EVENT: 'Tadbir',
  WARNING: 'Ogohlantirish',
};

export function AnnouncementInbox() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ['announcements', 'inbox'], queryFn: announcementApi.inbox });
  const markRead = useMutation({
    mutationFn: announcementApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements', 'inbox'] }),
    onError: (error: Error) => toast({ variant: 'destructive', title: "O'qilganlik saqlanmadi", description: error.message }),
  });
  const items = query.data ?? [];
  const unread = items.filter(item => !item.read).length;

  const open = async (item: AnnouncementInboxItem) => {
    if (!item.read) await markRead.mutateAsync(item.id);
    if (item.actionUrl) window.location.assign(item.actionUrl);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4" />Muhim e'lonlar</CardTitle>
            <CardDescription>Kurs yoki tashkilot tomonidan chop etilgan e'lonlar</CardDescription>
          </div>
          {unread > 0 && <Badge>{unread} ta o'qilmagan</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading && <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />E'lonlar yuklanmoqda...</div>}
        {query.error && <div className="flex items-center gap-2 rounded border border-destructive/30 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{query.error.message}<Button size="sm" variant="outline" className="ml-auto" onClick={() => query.refetch()}>Qayta urinish</Button></div>}
        {!query.isLoading && !query.error && items.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-7 w-7" />Hozircha e'lon yo'q.</div>}
        <div className="space-y-2">
          {items.map(item => (
            <button
              key={item.deliveryId}
              type="button"
              onClick={() => void open(item)}
              className={cn('w-full rounded-lg border p-3 text-left transition hover:bg-muted/40', !item.read && 'border-primary/30 bg-primary/5', item.priority === 'URGENT' && 'border-l-4 border-l-red-500', item.priority === 'HIGH' && 'border-l-4 border-l-amber-500')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.title}</strong>{!item.read && <span className="h-2 w-2 rounded-full bg-primary" />}<Badge variant="outline" className="text-[10px]">{categoryLabels[item.category]}</Badge></div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.courseTitle ?? 'Tashkilot'} · {item.authorName} · {formatDate(item.publishedAt)}</p>
                </div>
                {item.actionUrl ? <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" /> : item.read ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : null}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
