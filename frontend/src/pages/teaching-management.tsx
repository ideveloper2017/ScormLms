import { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Filter,
  Users,
  BookOpen,
  Calendar,
  Clock,
  Award,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Video,
  FileText,
  Star,
  TrendingUp,
  Target,
  BarChart3,
  User,
  CreditCard,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Progress } from '@/components/ui/progress.tsx';

const students = [
  {
    id: 1,
    name: 'Alisher Karimov',
    currentCourse: 'JavaScript Asoslari',
    currentLevel: 1,
    credits: 45,
    gpa: 4.2,
    status: 'active',
    nextCourse: 'React Development',
    canTransfer: true,
    completionRate: 85,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
    subjects: ['JavaScript', 'HTML/CSS', 'Git'],
    lastActivity: '2024-01-15',
  },
  {
    id: 2,
    name: 'Malika Tosheva',
    currentCourse: 'Python Dasturlash',
    currentLevel: 2,
    credits: 78,
    gpa: 4.8,
    status: 'active',
    nextCourse: 'Data Science',
    canTransfer: true,
    completionRate: 92,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    subjects: ['Python', 'SQL', 'Statistics'],
    lastActivity: '2024-01-15',
  },
  {
    id: 3,
    name: 'Bobur Rahimov',
    currentCourse: 'Web Development',
    currentLevel: 1,
    credits: 23,
    gpa: 3.5,
    status: 'retake',
    nextCourse: null,
    canTransfer: false,
    completionRate: 45,
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
    subjects: ['HTML', 'CSS'],
    lastActivity: '2024-01-12',
  },
];

const courses = [
  {
    id: 1,
    name: 'JavaScript Asoslari',
    level: 1,
    credits: 30,
    duration: '3 oy',
    students: 45,
    prerequisites: [],
    nextCourses: ['React Development', 'Node.js'],
  },
  {
    id: 2,
    name: 'React Development',
    level: 2,
    credits: 40,
    duration: '4 oy',
    students: 32,
    prerequisites: ['JavaScript Asoslari'],
    nextCourses: ['Full Stack Development'],
  },
  {
    id: 3,
    name: 'Python Dasturlash',
    level: 1,
    credits: 35,
    duration: '3.5 oy',
    students: 38,
    prerequisites: [],
    nextCourses: ['Data Science', 'Django Framework'],
  },
];

const organizationalTools = [
  {
    id: 1,
    type: 'schedule',
    title: 'Mashg\'ulotlar Jadvali',
    description: 'Haftalik va oylik dars jadvallari',
    count: 24,
    icon: Calendar,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 2,
    type: 'consultation',
    title: 'Konsultatsiyalar',
    description: 'Individual va guruhiy konsultatsiyalar',
    count: 12,
    icon: MessageSquare,
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 3,
    type: 'conference',
    title: 'Konferensiyalar',
    description: 'Ilmiy va amaliy konferensiyalar',
    count: 8,
    icon: Video,
    color: 'bg-purple-100 text-purple-800',
  },
  {
    id: 4,
    type: 'assignment',
    title: 'Vazifa Muddatlari',
    description: 'Topshiriqlar va loyihalar muddati',
    count: 35,
    icon: Clock,
    color: 'bg-orange-100 text-orange-800',
  },
  {
    id: 5,
    type: 'webinar',
    title: 'Vebinarlar',
    description: 'Onlayn ta\'lim seansları',
    count: 16,
    icon: Video,
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    id: 6,
    type: 'exam',
    title: 'Imtihonlar',
    description: 'Oraliq va yakuniy imtihonlar',
    count: 18,
    icon: FileText,
    color: 'bg-red-100 text-red-800',
  },
];

const subjects = [
  { id: 1, name: 'JavaScript Dasturlash', credits: 6, level: 1, active: true },
  { id: 2, name: 'HTML/CSS Asoslari', credits: 4, level: 1, active: true },
  { id: 3, name: 'React Framework', credits: 8, level: 2, active: true },
  { id: 4, name: 'Node.js Backend', credits: 7, level: 2, active: true },
  { id: 5, name: 'Python Dasturlash', credits: 6, level: 1, active: true },
  { id: 6, name: 'Data Science', credits: 10, level: 3, active: true },
  { id: 7, name: 'Machine Learning', credits: 12, level: 3, active: false },
];

const subjectColumns: ColumnDef<(typeof subjects)[0]>[] = [
  {
    accessorKey: 'name',
    header: 'Fan nomi',
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'credits',
    header: 'Kreditlar',
    cell: ({ getValue }) => <Badge variant="secondary">{getValue<number>()} kredit</Badge>,
  },
  {
    accessorKey: 'level',
    header: 'Daraja',
    cell: ({ getValue }) => <Badge variant="outline">Daraja {getValue<number>()}</Badge>,
  },
  {
    accessorKey: 'active',
    header: 'Holat',
    cell: ({ getValue }) => getValue<boolean>()
      ? <Badge className="bg-green-100 text-green-800">Faol</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Nofaol</Badge>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Amallar</div>,
    enableSorting: false,
    cell: () => (
      <div className="flex items-center gap-1 justify-end">
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
      </div>
    ),
  },
];

export function TeachingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState('transfers');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.currentCourse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
      case 'retake':
        return <Badge className="bg-orange-100 text-orange-800">Qayta o'qish</Badge>;
      case 'transferred':
        return <Badge className="bg-blue-100 text-blue-800">O'tkazilgan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransferStatus = (student: any) => {
    if (student.canTransfer && student.completionRate >= 80) {
      return <Badge className="bg-green-100 text-green-800">Tayyor</Badge>;
    } else if (student.completionRate < 60) {
      return <Badge className="bg-red-100 text-red-800">Qayta o'qish</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Jarayonda</Badge>;
    }
  };

  const transferColumns: ColumnDef<(typeof students)[0]>[] = [
    {
      accessorKey: 'name',
      header: 'Talaba',
      cell: ({ row: { original: s } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={s.avatar} alt={s.name} />
            <AvatarFallback>{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{s.name}</div>
            <div className="text-sm text-muted-foreground">GPA: {s.gpa}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'currentCourse',
      header: 'Joriy Kurs',
      cell: ({ row: { original: s } }) => (
        <div>
          <div className="font-medium">{s.currentCourse}</div>
          <div className="text-sm text-muted-foreground">Daraja {s.currentLevel}</div>
        </div>
      ),
    },
    {
      accessorKey: 'credits',
      header: 'Kreditlar',
      cell: ({ getValue }) => <span className="font-medium">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'completionRate',
      header: "O'zlashtirish",
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return (
          <div className="space-y-1 min-w-[100px]">
            <div className="text-sm">{v}%</div>
            <Progress value={v} className="h-2" />
          </div>
        );
      },
    },
    {
      accessorKey: 'nextCourse',
      header: 'Keyingi Kurs',
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? <span className="text-sm">{v}</span> : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Holat',
      cell: ({ row }) => getTransferStatus(row.original),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Amallar</div>,
      enableSorting: false,
      cell: ({ row: { original: s } }) => (
        <div className="flex items-center gap-1 justify-end">
          {s.canTransfer && (
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowRight className="h-3 w-3" />O'tkazish
            </Button>
          )}
          {s.status === 'retake' && (
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-3 w-3" />Qayta
            </Button>
          )}
          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">O'qitishni Boshqarish</h1>
          <p className="text-muted-foreground">
            Talabalarni o'tkazish, kreditlar berish va tashkiliy-metodik vositalarni boshqarish
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Hisobot
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yangi Jarayon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yangi O'quv Jarayoni</DialogTitle>
                <DialogDescription>
                  Talabani yangi kursga o'tkazish yoki qayta o'qitish jarayonini boshlash
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Talaba</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Talabani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jarayon turi</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Turni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer">Kursga o'tkazish</SelectItem>
                        <SelectItem value="retake">Qayta o'qitish</SelectItem>
                        <SelectItem value="credit">Kredit berish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Maqsadli kurs</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Kursni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name} - {course.credits} kredit
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Izoh</Label>
                  <Textarea placeholder="Jarayon haqida qo'shimcha ma'lumot" />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Jarayonni Boshlash</Button>
                  <Button variant="outline">Bekor qilish</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              O'tkazishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <div className="text-xs text-muted-foreground">Bu oy</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Berilgan Kreditlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-xs text-muted-foreground">Jami</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Qayta O'qitish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-muted-foreground">Faol jarayonlar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Muvaffaqiyat %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-muted-foreground">O'tkazishlar</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="transfers">O'tkazishlar</TabsTrigger>
          <TabsTrigger value="credits">Kreditlar</TabsTrigger>
          <TabsTrigger value="organizational">Tashkiliy Vositalar</TabsTrigger>
          <TabsTrigger value="subjects">Fanlar Ro'yxati</TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
        </TabsList>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Talabalarni qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="retake">Qayta o'qish</SelectItem>
                <SelectItem value="transferred">O'tkazilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students Transfer Table */}
          <Card>
            <CardHeader>
              <CardTitle>Talabalarni O'tkazish</CardTitle>
              <CardDescription>
                Talabalarning joriy holati va keyingi kursga o'tkazish imkoniyatlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transferColumns}
                data={filteredStudents}
                emptyText="Talaba topilmadi"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.currentCourse}</p>
                      </div>
                    </div>
                    {getStatusBadge(student.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Jami Kreditlar</p>
                      <p className="text-2xl font-bold text-blue-600">{student.credits}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">GPA</p>
                      <p className="text-2xl font-bold text-green-600">{student.gpa}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">O'rganiladigan fanlar:</p>
                    <div className="flex flex-wrap gap-1">
                      {student.subjects.map((subject, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <CreditCard className="h-3 w-3" />
                      Kredit Berish
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Organizational Tools Tab */}
        <TabsContent value="organizational" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizationalTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.id} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tool.color.replace('text-', 'bg-').replace('800', '100')}`}>
                        <Icon className={`h-5 w-5 ${tool.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{tool.title}</h3>
                        <p className="text-sm text-muted-foreground">{tool.count} ta element</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2" size="sm">
                        <Plus className="h-4 w-4" />
                        Qo'shish
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Boshqarish
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>So'nggi Tashkiliy Faoliyatlar</CardTitle>
              <CardDescription>Oxirgi o'zgarishlar va yangilanishlar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'schedule', action: 'Yangi mashg\'ulot jadvali yaratildi', time: '2 soat oldin', user: 'Admin' },
                  { type: 'consultation', action: 'JavaScript bo\'yicha konsultatsiya rejalashtirildi', time: '4 soat oldin', user: 'Alisher Karimov' },
                  { type: 'exam', action: 'React imtihon sanasi o\'zgartirildi', time: '1 kun oldin', user: 'Malika Tosheva' },
                  { type: 'webinar', action: 'Python vebinari yakunlandi', time: '2 kun oldin', user: 'Bobur Rahimov' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'schedule' ? 'bg-blue-500' :
                      activity.type === 'consultation' ? 'bg-green-500' :
                      activity.type === 'exam' ? 'bg-red-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{activity.action}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {activity.user} • {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">O'rganiladigan Fanlar Ro'yxati</h2>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Fan
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fanlar Ro'yxati</CardTitle>
              <CardDescription>
                Barcha o'rganiladigan fanlar va ularning kredit qiymatlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={subjectColumns}
                data={subjects}
                searchPlaceholder="Fan nomini qidirish..."
                emptyText="Fan topilmadi"
              />
            </CardContent>
          </Card>
        </TabsContent>


        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Muvaffaqiyatli O'tkazishlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">87%</div>
                <div className="text-xs text-muted-foreground">Bu oy</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  O'rtacha Kredit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">52.3</div>
                <div className="text-xs text-muted-foreground">Talaba uchun</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Qayta O'qish Foizi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">13%</div>
                <div className="text-xs text-muted-foreground">Kamayish tendensiyasi</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Faol Fanlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{subjects.filter(s => s.active).length}</div>
                <div className="text-xs text-muted-foreground">Jami {subjects.length} dan</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>O'qitish Samaradorligi</CardTitle>
              <CardDescription>Kurslar bo'yicha o'tkazish va qayta o'qitish statistikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">{course.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.students} talaba • {course.credits} kredit
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(Math.random() * 20) + 80}%
                        </div>
                        <div className="text-xs text-muted-foreground">O'tkazish</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-600">
                          {Math.floor(Math.random() * 15) + 5}%
                        </div>
                        <div className="text-xs text-muted-foreground">Qayta o'qish</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {course.credits}
                        </div>
                        <div className="text-xs text-muted-foreground">O'rt. kredit</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}