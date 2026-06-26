import { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  BookOpen,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  CheckCircle,
  AlertCircle,
  User,
  Filter,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
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
  Cell
} from 'recharts';

const studentsProgress = [
  {
    id: 1,
    name: 'Alisher Karimov',
    email: 'alisher@student.uz',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
    totalCourses: 5,
    completedCourses: 3,
    inProgressCourses: 2,
    totalHours: 120,
    completedHours: 85,
    averageScore: 88,
    attendanceRate: 92,
    lastActivity: '2024-01-15 14:30',
    learningPath: 'Web Development',
    currentLevel: 'Intermediate',
    achievements: ['JavaScript Master', 'React Specialist'],
    weeklyProgress: [
      { week: 'W1', hours: 8, completion: 15 },
      { week: 'W2', hours: 12, completion: 28 },
      { week: 'W3', hours: 10, completion: 42 },
      { week: 'W4', hours: 15, completion: 65 },
      { week: 'W5', hours: 11, completion: 78 },
      { week: 'W6', hours: 9, completion: 85 },
    ]
  },
  {
    id: 2,
    name: 'Malika Tosheva',
    email: 'malika@student.uz',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    totalCourses: 4,
    completedCourses: 4,
    inProgressCourses: 0,
    totalHours: 96,
    completedHours: 96,
    averageScore: 95,
    attendanceRate: 98,
    lastActivity: '2024-01-15 10:15',
    learningPath: 'Data Science',
    currentLevel: 'Advanced',
    achievements: ['Python Expert', 'Data Analyst', 'ML Specialist'],
    weeklyProgress: [
      { week: 'W1', hours: 16, completion: 20 },
      { week: 'W2', hours: 18, completion: 45 },
      { week: 'W3', hours: 14, completion: 65 },
      { week: 'W4', hours: 16, completion: 80 },
      { week: 'W5', hours: 16, completion: 95 },
      { week: 'W6', hours: 16, completion: 100 },
    ]
  },
  {
    id: 3,
    name: 'Bobur Rahimov',
    email: 'bobur@student.uz',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
    totalCourses: 3,
    completedCourses: 1,
    inProgressCourses: 2,
    totalHours: 72,
    completedHours: 28,
    averageScore: 75,
    attendanceRate: 78,
    lastActivity: '2024-01-14 16:45',
    learningPath: 'Mobile Development',
    currentLevel: 'Beginner',
    achievements: ['First Course Complete'],
    weeklyProgress: [
      { week: 'W1', hours: 4, completion: 8 },
      { week: 'W2', hours: 6, completion: 15 },
      { week: 'W3', hours: 3, completion: 20 },
      { week: 'W4', hours: 8, completion: 28 },
      { week: 'W5', hours: 4, completion: 32 },
      { week: 'W6', hours: 3, completion: 35 },
    ]
  },
];

const courseUtilization = [
  { course: 'JavaScript Asoslari', students: 245, avgTime: 45, completion: 85 },
  { course: 'React Development', students: 189, avgTime: 52, completion: 78 },
  { course: 'Python Dasturlash', students: 312, avgTime: 38, completion: 92 },
  { course: 'Data Science', students: 156, avgTime: 65, completion: 67 },
  { course: 'Mobile Development', students: 98, avgTime: 42, completion: 73 },
];

const learningPaths = [
  { name: 'Web Development', students: 456, avgCompletion: 82, color: '#3b82f6' },
  { name: 'Data Science', students: 234, avgCompletion: 78, color: '#10b981' },
  { name: 'Mobile Development', students: 189, avgCompletion: 75, color: '#f59e0b' },
  { name: 'AI/ML', students: 123, avgCompletion: 68, color: '#8b5cf6' },
];

const attendanceData = [
  { month: 'Yan', attendance: 92, target: 90 },
  { month: 'Fev', attendance: 88, target: 90 },
  { month: 'Mar', attendance: 94, target: 90 },
  { month: 'Apr', attendance: 91, target: 90 },
  { month: 'May', attendance: 96, target: 90 },
  { month: 'Iyun', attendance: 93, target: 90 },
];

export function AttendanceProgress() {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedPath, setSelectedPath] = useState('all');

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      'Beginner': 'bg-blue-100 text-blue-800',
      'Intermediate': 'bg-purple-100 text-purple-800',
      'Advanced': 'bg-green-100 text-green-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Davomat va O'zlashtirish</h1>
          <p className="text-muted-foreground">
            Talabalarning o'quv jarayoni, individual rejalar va o'zlashtirish tahlili
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Bu hafta</SelectItem>
              <SelectItem value="month">Bu oy</SelectItem>
              <SelectItem value="quarter">Bu chorak</SelectItem>
              <SelectItem value="year">Bu yil</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Hisobot
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Faol Talabalar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-1">2,456</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% o'sish
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              O'rtacha Davomat
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">92.5%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Maqsaddan yuqori
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              O'zlashtirish Darajasi
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 mb-1">84.7%</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <Activity className="h-3 w-3 mr-1" />
              Yaxshi natija
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              O'rtacha Vaqt
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 mb-1">47.2h</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              Haftalik
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pb-1">
          <TabsList className="grid min-w-[440px] w-full grid-cols-5">
          <TabsTrigger value="overview">Umumiy Ko'rinish</TabsTrigger>
          <TabsTrigger value="students">Talabalar</TabsTrigger>
          <TabsTrigger value="courses">Kurslar</TabsTrigger>
          <TabsTrigger value="paths">O'quv Yo'nalishlari</TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
        </TabsList>
          </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Davomat Tendensiyasi</CardTitle>
                <CardDescription>Oylik davomat ko'rsatkichlari</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="attendance" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Davomat %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#ef4444" 
                      strokeDasharray="5 5"
                      name="Maqsad"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Learning Paths Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>O'quv Yo'nalishlari</CardTitle>
                <CardDescription>Talabalar taqsimoti</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={learningPaths}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="students"
                    >
                      {learningPaths.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {learningPaths.map((path, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: path.color }}
                        />
                        <span>{path.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{path.students}</span>
                        <span className="text-muted-foreground">({path.avgCompletion}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Eng Yaxshi Natijalar</CardTitle>
              <CardDescription>Yuqori ko'rsatkichli talabalar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentsProgress.slice(0, 3).map((student, index) => (
                  <div key={student.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.learningPath}</div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{student.averageScore}%</div>
                        <div className="text-xs text-muted-foreground">O'rtacha ball</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{student.attendanceRate}%</div>
                        <div className="text-xs text-muted-foreground">Davomat</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {Math.round((student.completedCourses / student.totalCourses) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Yakunlagan</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Talabalar O'zlashtirish Jadvali</CardTitle>
              <CardDescription>Individual o'quv rejalari va natijalar</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talaba</TableHead>
                    <TableHead>O'quv Yo'nalishi</TableHead>
                    <TableHead>Daraja</TableHead>
                    <TableHead>Jarayon</TableHead>
                    <TableHead>Davomat</TableHead>
                    <TableHead>O'rtacha Ball</TableHead>
                    <TableHead>Oxirgi Faollik</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsProgress.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar} alt={student.name} />
                            <AvatarFallback>
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.learningPath}</TableCell>
                      <TableCell>
                        <Badge className={getLevelBadge(student.currentLevel)}>
                          {student.currentLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{student.completedCourses}/{student.totalCourses} kurs</span>
                            <span>{Math.round((student.completedCourses / student.totalCourses) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(student.completedCourses / student.totalCourses) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAttendanceColor(student.attendanceRate)}>
                          {student.attendanceRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getProgressColor(student.averageScore)}`}>
                          {student.averageScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.lastActivity}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedStudent(student.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kurslar Foydalanish Statistikasi</CardTitle>
              <CardDescription>Resurslardan foydalanish va o'zlashtirish ko'rsatkichlari</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kurs</TableHead>
                    <TableHead>Talabalar</TableHead>
                    <TableHead>O'rtacha Vaqt</TableHead>
                    <TableHead>Yakunlash %</TableHead>
                    <TableHead>Foydalanish</TableHead>
                    <TableHead className="text-right">Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseUtilization.map((course, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{course.course}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.students}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.avgTime}h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{course.completion}%</span>
                          </div>
                          <Progress value={course.completion} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span className={getProgressColor(course.completion)}>
                            {course.completion >= 80 ? 'Yuqori' : course.completion >= 60 ? 'O\'rta' : 'Past'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {course.completion >= 80 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Paths Tab */}
        <TabsContent value="paths" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningPaths.map((path, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{path.name}</span>
                    <Badge variant="secondary">{path.students} talaba</Badge>
                  </CardTitle>
                  <CardDescription>
                    O'rtacha o'zlashtirish: {path.avgCompletion}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={path.avgCompletion} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{path.students} talaba</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{path.avgCompletion}% o'zlashtirish</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Batafsil
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>O'zlashtirish Dinamikasi</CardTitle>
                <CardDescription>Haftalik o'zlashtirish ko'rsatkichlari</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentsProgress[0].weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#3b82f6" name="Soatlar" />
                    <Bar dataKey="completion" fill="#10b981" name="Yakunlash %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Individual Tahlil</CardTitle>
                <CardDescription>Tanlangan talaba uchun batafsil ma'lumot</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStudent ? (
                  <div className="space-y-4">
                    {(() => {
                      const student = studentsProgress.find(s => s.id === selectedStudent);
                      if (!student) return null;
                      
                      return (
                        <>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={student.avatar} alt={student.name} />
                              <AvatarFallback>
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-lg">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.learningPath}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Yakunlangan kurslar</div>
                              <div className="text-2xl font-bold text-green-600">
                                {student.completedCourses}/{student.totalCourses}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">O'rtacha ball</div>
                              <div className="text-2xl font-bold text-blue-600">{student.averageScore}%</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Yutuqlar</div>
                            <div className="flex flex-wrap gap-1">
                              {student.achievements.map((achievement, index) => (
                                <Badge key={index} variant="secondary" className="gap-1">
                                  <Award className="h-3 w-3" />
                                  {achievement}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={student.weeklyProgress}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="completion" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="Yakunlash %"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4" />
                    <p>Batafsil tahlil uchun talabani tanlang</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}