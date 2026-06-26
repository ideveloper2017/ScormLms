import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap, Plus, Search, Monitor, Clock, Users, Shield,
  Eye, Settings, Play, AlertTriangle, TrendingUp, Target,
  CheckCircle, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Label } from '@/components/ui/label.tsx';
import { qk } from '@/lib/query-keys';
import { examApi } from '@/services/api/exam-api';

const PROCTORING_FEATURES = [
  'Yuz tanish texnologiyasi', "Ko'z harakati kuzatuvi",
  'Ekran yozib olish', 'Tovush tahlili',
  'Brauzer faoliyati nazorati', 'Ikkinchi qurilma aniqlash',
];

function StatusBadge({ status }: { status: string }) {
  if (status === 'active')    return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
  if (status === 'upcoming')  return <Badge className="bg-blue-100 text-blue-800">Rejalashtirilgan</Badge>;
  if (status === 'completed') return <Badge className="bg-gray-100 text-gray-800">Yakunlangan</Badge>;
  if (status === 'cancelled') return <Badge className="bg-red-100 text-red-800">Bekor qilingan</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export function Exams() {
  const [searchTerm, setSearchTerm] = useState('');
  const [proctoringEnabled, setProctoringEnabled] = useState(true);

  const { data: exams = [], isLoading: examsLoading, error: examsError, refetch } = useQuery({
    queryKey: qk.exams.list(),
    queryFn: examApi.getExams,
    staleTime: 60_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: qk.exams.stats(),
    queryFn: examApi.getStats,
    staleTime: 60_000,
  });

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (examsLoading || statsLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="pt-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  if (examsError) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Imtihonlar</h1>
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
            <p className="text-sm text-muted-foreground">{(examsError as Error).message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Imtihonlar</h1>
          <p className="text-muted-foreground">Avtoproktoring tizimi bilan imtihonlarni boshqaring</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Yangi Imtihon</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yangi Imtihon Yaratish</DialogTitle>
              <DialogDescription>Avtoproktoring sozlamalari bilan yangi imtihon yarating</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Imtihon nomi</Label>
                  <Input placeholder="Imtihon nomini kiriting" />
                </div>
                <div className="space-y-2">
                  <Label>Kurs</Label>
                  <Input placeholder="Kursni tanlang" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Davomiyligi (daqiqa)</Label>
                  <Input type="number" placeholder="90" />
                </div>
                <div className="space-y-2">
                  <Label>Savollar soni</Label>
                  <Input type="number" placeholder="50" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Avtoproktoring</Label>
                    <p className="text-sm text-muted-foreground">AI asosida imtihon jarayonini nazorat qilish</p>
                  </div>
                  <Switch checked={proctoringEnabled} onCheckedChange={setProctoringEnabled} />
                </div>
                {proctoringEnabled && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />Proctoring Xususiyatlari
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {PROCTORING_FEATURES.map(f => (
                          <div key={f} className="flex items-center gap-2 text-sm">
                            <Shield className="h-3 w-3 text-blue-600" />{f}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Imtihon Yaratish</Button>
                <Button variant="outline">Bekor qilish</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Imtihonlarni qidiring..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Jami Imtihonlar', value: stats?.total ?? 0,               icon: GraduationCap, cls: 'text-indigo-600', cardCls: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20' },
          { label: 'Rejalashtirilgan', value: stats?.upcoming ?? 0,            icon: Monitor,       cls: 'text-rose-600',   cardCls: 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20'       },
          { label: "O'tish Foizi",    value: `${stats?.passRate ?? 0}%`,       icon: Target,        cls: 'text-teal-600',   cardCls: 'border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20'       },
          { label: "O'rtacha Ball",   value: stats?.avgScore?.toFixed(1) ?? 0, icon: GraduationCap, cls: 'text-blue-600',   cardCls: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20' },
        ].map(({ label, value, icon: Icon, cls, cardCls }) => (
          <Card key={label} className={`border-2 hover:shadow-xl transition-all duration-300 hover:scale-105 ${cardCls}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>{label}</span>
                <div className="p-2 rounded-lg bg-gradient-to-br from-current to-current shadow-md opacity-80">
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-1 ${cls}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Imtihonlar Ro'yxati</CardTitle>
          <CardDescription>
            {filteredExams.length} ta imtihon
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Imtihon topilmadi</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imtihon</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead>Davomiyligi</TableHead>
                  <TableHead>Ishtirokchilar</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>O'tish %</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map(exam => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div className="font-medium">{exam.title}</div>
                      <div className="text-sm text-muted-foreground">{exam.totalQuestions} savol</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{exam.course}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />{exam.duration} daq
                      </div>
                    </TableCell>
                    <TableCell>
                      {exam.participants !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />{exam.participants}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={exam.status} /></TableCell>
                    <TableCell>
                      {exam.passRate !== undefined ? (
                        <span className={exam.passRate >= 80 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                          {exam.passRate}%
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
                        {exam.status === 'active' && (
                          <Button variant="ghost" size="icon"><Play className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
