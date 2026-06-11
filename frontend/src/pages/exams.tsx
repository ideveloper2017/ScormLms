import { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Monitor,
  Clock,
  Users,
  Shield,
  Eye,
  Settings,
  Play,
  AlertTriangle,
  TrendingUp,
  Target,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Label } from '@/components/ui/label.tsx';

const exams = [
  {
    id: 1,
    title: 'JavaScript Yakuniy Imtihon',
    course: 'JavaScript Asoslari',
    duration: 90,
    questions: 50,
    participants: 156,
    proctoring: true,
    status: 'active',
    passRate: 78,
    avgScore: 85,
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    title: 'React Components Test',
    course: 'React Development',
    duration: 60,
    questions: 30,
    participants: 89,
    proctoring: true,
    status: 'scheduled',
    passRate: 82,
    avgScore: 88,
    createdAt: '2024-01-10',
  },
  {
    id: 3,
    title: 'Python Syntax Quiz',
    course: 'Python Dasturlash',
    duration: 45,
    questions: 25,
    participants: 234,
    proctoring: false,
    status: 'completed',
    passRate: 91,
    avgScore: 92,
    createdAt: '2024-01-05',
  },
];

const proctoringFeatures = [
  'Yuz tanish texnologiyasi',
  'Ko\'z harakati kuzatuvi',
  'Ekran yozib olish',
  'Tovush tahlili',
  'Brauzer faoliyati nazorati',
  'Ikkinchi qurilma aniqlash',
];

export function Exams() {
  const [searchTerm, setSearchTerm] = useState('');
  const [proctoringEnabled, setProctoringEnabled] = useState(true);

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Rejalashtirilgan</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Yakunlangan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Imtihonlar</h1>
          <p className="text-muted-foreground">
            Avtoproktoring tizimi bilan imtihonlarni boshqaring
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Imtihon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yangi Imtihon Yaratish</DialogTitle>
              <DialogDescription>
                Avtoproktoring sozlamalari bilan yangi imtihon yarating
              </DialogDescription>
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
                    <p className="text-sm text-muted-foreground">
                      AI asosida imtihon jarayonini nazorat qilish
                    </p>
                  </div>
                  <Switch 
                    checked={proctoringEnabled} 
                    onCheckedChange={setProctoringEnabled}
                  />
                </div>

                {proctoringEnabled && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Proctoring Xususiyatlari
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {proctoringFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Shield className="h-3 w-3 text-blue-600" />
                            {feature}
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Imtihonlarni qidiring..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>
              Jami Imtihonlar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 mb-1">127</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +8 yangi
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>
              Proctoring Bilan
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 shadow-md">
                <Monitor className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 mb-1">89</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Monitor className="h-3 w-3 text-blue-500" />
              70% dan ko'p
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>
              O'tish Foizi
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600 mb-1">84%</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Yaxshi natija
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>
              O'rtacha Ball
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5</div>
            <div className="text-xs text-muted-foreground">+2.3 o'sish</div>
          </CardContent>
        </Card>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Imtihonlar Ro'yxati</CardTitle>
          <CardDescription>
            Barcha imtihonlar va ularning holati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imtihon</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>Davomiyligi</TableHead>
                <TableHead>Ishtirokchilar</TableHead>
                <TableHead>Proctoring</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>O'tish %</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{exam.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {exam.questions} savol
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {exam.course}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exam.duration} daq
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {exam.participants}
                    </div>
                  </TableCell>
                  <TableCell>
                    {exam.proctoring ? (
                      <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800">
                        <Monitor className="h-3 w-3" />
                        Faol
                      </Badge>
                    ) : (
                      <Badge variant="outline">O'chiq</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(exam.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {exam.passRate >= 80 ? (
                        <div className="text-green-600 font-medium">{exam.passRate}%</div>
                      ) : (
                        <div className="text-orange-600 font-medium">{exam.passRate}%</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                      {exam.status === 'active' && (
                        <Button variant="ghost" size="icon">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}