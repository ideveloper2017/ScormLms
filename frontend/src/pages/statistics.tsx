import { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  BookOpen,
  GraduationCap,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Archive,
  FileText,
  PieChart,
  Activity,
  Award,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

const contingentData = {
  total: 2847,
  active: 2756,
  graduated: 456,
  transferred: 89,
  expelled: 23,
  suspended: 68,
  newAdmissions: 234,
  monthlyGrowth: 8.2,
};

const learningProgressData = [
  { month: 'Yan', completion: 78, gpa: 4.1, courses: 156 },
  { month: 'Fev', completion: 82, gpa: 4.2, courses: 168 },
  { month: 'Mar', completion: 85, gpa: 4.3, courses: 172 },
  { month: 'Apr', completion: 87, gpa: 4.4, courses: 185 },
  { month: 'May', completion: 89, gpa: 4.5, courses: 198 },
  { month: 'Iyun', completion: 92, gpa: 4.6, courses: 210 },
];

const courseContentData = [
  { category: 'Dasturlash', total: 45, completed: 42, inProgress: 3, percentage: 93 },
  { category: 'Ma\'lumotlar tahlili', total: 28, completed: 25, inProgress: 3, percentage: 89 },
  { category: 'Web Development', total: 35, completed: 31, inProgress: 4, percentage: 89 },
  { category: 'Mobile Development', total: 22, completed: 18, inProgress: 4, percentage: 82 },
  { category: 'Dizayn', total: 18, completed: 15, inProgress: 3, percentage: 83 },
];

const studentMovementData = [
  { 
    id: 1, 
    student: 'Alisher Karimov', 
    action: 'qabul', 
    fromCourse: null, 
    toCourse: 'JavaScript Asoslari', 
    date: '2024-01-15', 
    reason: 'Yangi talaba',
    status: 'completed'
  },
  { 
    id: 2, 
    student: 'Malika Tosheva', 
    action: 'ko\'chirish', 
    fromCourse: 'Python Asoslari', 
    toCourse: 'Data Science', 
    date: '2024-01-14', 
    reason: 'Kursni muvaffaqiyatli yakunladi',
    status: 'completed'
  },
  { 
    id: 3, 
    student: 'Bobur Rahimov', 
    action: 'chetlashtirish', 
    fromCourse: 'Web Development', 
    toCourse: null, 
    date: '2024-01-13', 
    reason: 'Davomatsizlik',
    status: 'completed'
  },
  { 
    id: 4, 
    student: 'Nodira Saidova', 
    action: 'qayta_tiklash', 
    fromCourse: null, 
    toCourse: 'React Development', 
    date: '2024-01-12', 
    reason: 'Ariza asosida',
    status: 'pending'
  },
];

const archivedData = [
  { year: '2023', graduated: 1245, transferred: 156, expelled: 45, total: 1446 },
  { year: '2022', graduated: 1156, transferred: 134, expelled: 38, total: 1328 },
  { year: '2021', graduated: 1089, transferred: 123, expelled: 42, total: 1254 },
];

const distributionData = [
  { name: 'Faol talabalar', value: 2756, color: '#10b981' },
  { name: 'To\'xtatilgan', value: 68, color: '#f59e0b' },
  { name: 'Chetlashtirilgan', value: 23, color: '#ef4444' },
];

export function Statistics() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-year');
  const [selectedTab, setSelectedTab] = useState('contingent');

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'qabul':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'ko\'chirish':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'chetlashtirish':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'qayta_tiklash':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const badges = {
      qabul: 'bg-green-100 text-green-800',
      'ko\'chirish': 'bg-blue-100 text-blue-800',
      chetlashtirish: 'bg-red-100 text-red-800',
      qayta_tiklash: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      qabul: 'Qabul',
      'ko\'chirish': 'Ko\'chirish',
      chetlashtirish: 'Chetlashtirish',
      qayta_tiklash: 'Qayta tiklash',
    };
    return (
      <Badge className={badges[action as keyof typeof badges]}>
        {labels[action as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Bajarilgan</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Kutilmoqda</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rad etilgan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistika</h1>
          <p className="text-muted-foreground">
            Talabalar kontingenti, o'zlashtirish ko'rsatkichlari va ta'lim jarayoni statistikasi
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Joriy oy</SelectItem>
              <SelectItem value="current-quarter">Joriy chorak</SelectItem>
              <SelectItem value="current-year">Joriy yil</SelectItem>
              <SelectItem value="all-time">Barcha vaqt</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Hisobot
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jami Kontingent
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">2,847</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{contingentData.monthlyGrowth}% o'sish
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Faol Talabalar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">2,756</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((contingentData.active / contingentData.total) * 100)}% faollik
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Bitiruvchilar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{contingentData.graduated}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Award className="h-3 w-3 text-yellow-500 fill-current" />
              Bu yil
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              O'rtacha O'zlashtirish
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">89%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +3% yaxshilash
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contingent">Kontingent</TabsTrigger>
          <TabsTrigger value="progress">O'zlashtirish</TabsTrigger>
          <TabsTrigger value="content">Kurs Kontenti</TabsTrigger>
          <TabsTrigger value="movement">Talabalar Harakati</TabsTrigger>
          <TabsTrigger value="archive">Arxiv</TabsTrigger>
        </TabsList>

        {/* Contingent Tab */}
        <TabsContent value="contingent" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contingent Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Kontingent Taqsimoti</CardTitle>
                <CardDescription>Talabalar holati bo'yicha taqsimot</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {distributionData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Oylik O'sish</CardTitle>
                <CardDescription>Kontingent o'zgarishi dinamikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={learningProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="courses" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name="Talabalar soni"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yangi Qabul</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-green-600">
                  {contingentData.newAdmissions}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bu oy</span>
                    <span>45 kishi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>O'tgan oy</span>
                    <span>38 kishi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>O'sish</span>
                    <span className="text-green-600">+18%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ko'chirishlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">
                  {contingentData.transferred}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Muvaffaqiyatli</span>
                    <span>76 kishi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kutilmoqda</span>
                    <span>13 kishi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Muvaffaqiyat %</span>
                    <span className="text-blue-600">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chetlashtirishlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-red-600">
                  {contingentData.expelled}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Davomatsizlik</span>
                    <span>15 kishi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Akademik qarzdorlik</span>
                    <span>8 kishi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Foiz</span>
                    <span className="text-red-600">0.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>O'zlashtirish Dinamikasi</CardTitle>
                <CardDescription>Oylik o'zlashtirish ko'rsatkichlari</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={learningProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="completion" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="O'zlashtirish %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GPA Dinamikasi</CardTitle>
                <CardDescription>O'rtacha ball o'zgarishi</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={learningProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[3.5, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="gpa" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="O'rtacha GPA"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>O'zlashtirish Ko'rsatkichlari</CardTitle>
              <CardDescription>Kategoriyalar bo'yicha batafsil tahlil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Yuqori (90-100%)', count: 1245, percentage: 44, color: 'bg-green-500' },
                  { category: 'Yaxshi (80-89%)', count: 987, percentage: 35, color: 'bg-blue-500' },
                  { category: 'O\'rta (70-79%)', count: 456, percentage: 16, color: 'bg-yellow-500' },
                  { category: 'Past (60-69%)', count: 123, percentage: 4, color: 'bg-orange-500' },
                  { category: 'Qoniqarsiz (<60%)', count: 36, percentage: 1, color: 'bg-red-500' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 text-sm">{item.category}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium w-12">{item.percentage}%</div>
                        <div className="text-sm text-muted-foreground w-16">
                          {item.count} kishi
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kurslar Kontenti To'ldirilganligi</CardTitle>
              <CardDescription>Kategoriyalar bo'yicha kurs kontenti statistikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {courseContentData.map((course, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{course.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.completed} / {course.total} kurs yakunlangan
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {course.percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {course.inProgress} jarayonda
                        </div>
                      </div>
                    </div>
                    <Progress value={course.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video Darslar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <div className="text-sm text-muted-foreground">Jami video</div>
                <div className="mt-2 text-sm">
                  <span className="text-green-600">892 faol</span> • 
                  <span className="text-yellow-600 ml-1">355 yangilanmoqda</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SCORM Paketlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">456</div>
                <div className="text-sm text-muted-foreground">Jami paket</div>
                <div className="mt-2 text-sm">
                  <span className="text-green-600">423 uyg'un</span> • 
                  <span className="text-red-600 ml-1">33 xato</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Testlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,156</div>
                <div className="text-sm text-muted-foreground">Jami test</div>
                <div className="mt-2 text-sm">
                  <span className="text-green-600">1,987 faol</span> • 
                  <span className="text-gray-600 ml-1">169 arxiv</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Student Movement Tab */}
        <TabsContent value="movement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Talabalar Harakati</CardTitle>
              <CardDescription>
                Qabul, ko'chirish, chetlashtirish va qayta tiklash jarayonlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talaba</TableHead>
                    <TableHead>Harakat</TableHead>
                    <TableHead>Dan</TableHead>
                    <TableHead>Ga</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Sabab</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentMovementData.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">{movement.student}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(movement.action)}
                          {getActionBadge(movement.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.fromCourse || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.toCourse || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{movement.date}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.reason}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(movement.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bu Oy Qabul
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">45</div>
                <div className="text-xs text-muted-foreground">+18% o'sish</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ko'chirishlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">23</div>
                <div className="text-xs text-muted-foreground">85% muvaffaqiyat</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Chetlashtirishlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">8</div>
                <div className="text-xs text-muted-foreground">0.3% umumiy</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Qayta Tiklash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">12</div>
                <div className="text-xs text-muted-foreground">Ariza asosida</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arxivlashtirilgan Ma'lumotlar</CardTitle>
              <CardDescription>
                O'qishni bitirgan, ko'chirgan va chetlashtirilganlar arxivi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yil</TableHead>
                    <TableHead>Bitiruvchilar</TableHead>
                    <TableHead>Ko'chirilganlar</TableHead>
                    <TableHead>Chetlashtirilganlar</TableHead>
                    <TableHead>Jami</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedData.map((data) => (
                    <TableRow key={data.year}>
                      <TableCell className="font-medium">{data.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-green-600" />
                          {data.graduated.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                          {data.transferred.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4 text-red-600" />
                          {data.expelled.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {data.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Archive className="h-3 w-3" />
                            Ko'rish
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Download className="h-3 w-3" />
                            Yuklab olish
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Yillik Statistika</CardTitle>
                <CardDescription>Arxivlashtirilgan ma'lumotlar dinamikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={archivedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="graduated" fill="#10b981" name="Bitiruvchilar" />
                    <Bar dataKey="transferred" fill="#3b82f6" name="Ko'chirilganlar" />
                    <Bar dataKey="expelled" fill="#ef4444" name="Chetlashtirilganlar" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arxiv Xulosa</CardTitle>
                <CardDescription>Umumiy ko'rsatkichlar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {archivedData.reduce((sum, item) => sum + item.graduated, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      Jami bitiruvchilar
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {archivedData.reduce((sum, item) => sum + item.transferred, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">
                      Jami ko'chirilganlar
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Muvaffaqiyat darajasi</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>O'rtacha bitirish muddati</span>
                    <span className="font-medium">8.5 oy</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Eng yuqori bitirish yili</span>
                    <span className="font-medium">2023</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}