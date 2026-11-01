import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FilePlus2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listStudentMovements } from '@/lib/student-api';
import type { StudentLifecycleEventType, StudentStatus } from '@/types/student.types';

const statusLabel: Record<StudentStatus, string> = {
  REGISTERED: 'Qabul qilinmagan', ACTIVE: 'Faol', SUSPENDED: "To'xtatilgan", EXPELLED: 'Chetlashtirilgan', GRADUATED: 'Bitirgan',
};
const PAGE_SIZE = 20;

/**
 * Talabalar harakati buyruqlari reyestri (masalan akademik ta'til yoki o'qishni tiklash): har talabaning shu turdagi
 * oxirgi buyrug'i — F.I.O., guruh, joriy holati, buyruq raqami va sanasi. Yangi buyruq talaba kartasida rasmiylashtiriladi.
 */
export function StudentMovementRegistry({ eventType, title, description, showReason = false }: {
  eventType: StudentLifecycleEventType;
  title: string;
  description: string;
  /** "Sabab" ustuni (akademik ta'tilda kerak) */
  showReason?: boolean;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => { setTerm(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const movements = useQuery({
    queryKey: ['students', 'movements', eventType, term, page],
    queryFn: () => listStudentMovements({ eventType, search: term || undefined, page, size: PAGE_SIZE }),
  });
  const data = movements.data;

  return <div className="space-y-6 p-3 sm:p-4 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" onClick={() => navigate('/students/students')}
        title="Talabani ro'yxatdan tanlang va kartasidagi amallar orqali buyruqni rasmiylashtiring">
        <FilePlus2 className="mr-2 h-4 w-4" />Yangi buyruq
      </Button>
    </div>

    <Input className="max-w-sm" aria-label="Talaba qidirish" placeholder="F.I.O. yoki talaba raqami" maxLength={100}
      value={search} onChange={(event) => setSearch(event.target.value)} />

    {movements.isLoading && <div className="flex justify-center p-12"><Loader2 className="animate-spin" aria-label="Yuklanmoqda" /></div>}
    {movements.isError && <Card><CardContent className="space-y-3 py-10 text-center">
      <p className="text-destructive">Ro'yxatni yuklab bo'lmadi.</p>
      <Button variant="outline" onClick={() => void movements.refetch()}>Qayta urinish</Button>
    </CardContent></Card>}

    {data && <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-12">№</TableHead>
          <TableHead>F.I.O.</TableHead>
          <TableHead>Guruh</TableHead>
          <TableHead>Holati</TableHead>
          {showReason && <TableHead>Sabab</TableHead>}
          <TableHead>Buyruq raqami</TableHead>
          <TableHead>Buyruq sanasi</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {data.items.map((item, index) => <TableRow key={item.eventId}>
            <TableCell className="text-muted-foreground">{data.page * data.size + index + 1}</TableCell>
            <TableCell><p className="font-medium">{item.studentName}</p><p className="font-mono text-xs text-muted-foreground">{item.studentNumber}</p></TableCell>
            <TableCell>{item.groupName ?? '—'}</TableCell>
            <TableCell><Badge variant={item.studentStatus === 'ACTIVE' ? 'default' : 'secondary'}>{statusLabel[item.studentStatus]}</Badge></TableCell>
            {showReason && <TableCell className="max-w-xs text-sm">{item.reason}</TableCell>}
            <TableCell className="font-mono text-sm">{item.orderNumber}</TableCell>
            <TableCell className="whitespace-nowrap">{item.orderDate}</TableCell>
          </TableRow>)}
          {data.items.length === 0 && <TableRow><TableCell colSpan={showReason ? 7 : 6} className="h-24 text-center text-muted-foreground">Ma'lumot mavjud emas</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>}

    {data && data.totalElements > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>{data.totalElements} ta talaba · {data.page + 1} / {Math.max(data.totalPages, 1)} sahifa</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={data.page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Oldingi</Button>
        <Button variant="outline" size="sm" disabled={data.page + 1 >= data.totalPages} onClick={() => setPage((value) => value + 1)}>Keyingi<ChevronRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>}
  </div>;
}
