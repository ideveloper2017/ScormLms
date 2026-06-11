import { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Settings,
  Clock,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Video,
  FileText,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';

const instructorData = {
  name: 'Dr. Aziz Karimov',
  email: 'aziz@instructor.uz',
  department: 'Dasturlash',
  avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100',
  totalStudents: 156,
  activeCourses: 3,
  completedCourses: 12,
  rating: 4.8,
};

const myCourses = [
  {
    id: 1,
    title: 'JavaScript Asoslari',
    students: 45,
    progress: 75,
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    avgGrade: 4.2,
    completionRate: 85,
  },
  {
    id: 2,
    title: 'React Development',
    students: 32,
    progress: 60,
    status: 'active',
    startDate: '2024-01-10',
    endDate: '2024-07-10',
    avgGrade: 4.5,
    completionRate: 78,
  },
  {
    id: 3,
    title: 'Node.js Backend',
    students: 28,
    progress: 40,
    status: 'active',
    startDate: '2024-01-05',
    endDate: '2024-08-05',
    avgGrade: 4.1,
    completionRate: 72,
  },
];

const recentStudents = [
  {
    id: 1,
    name: 'Alisher Karimov',
    course: 'JavaScript Asoslari',
    progress: 85,
    grade: 'A',
    lastActivity: '2 soat oldin',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 2,
    name: 'Malika Tosheva',
    course: 'React Development',
    progress: 92,
    grade: 'A+',
    lastActivity: '4 soat oldin',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 3,
    name: 'Bobur Rahimov',
    course: 'Node.js Backend',
    progress: 67,
    grade: 'B+',
    lastActivity: '1 kun oldin',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
];

const upcomingTasks = [
  {
    id: 1,
    title: 'JavaScript Imtihon',
    course: 'JavaScript Asoslari',
    date: '2024-01-20',
    type: 'exam',
    students: 45,
  },
  {
    id: 2,
    title: 'React Loyiha Baholash',
    course: 'React Development',
    date: '2024-01-25',
    type: 'assignment',
    students: 32,
  },
  {
    id: 3,
    title: 'Node.js Vebinar',
    course: 'Node.js Backend',
    date: '2024-01-30',
    type: 'webinar',
    students: 28,
  },
];

const courseAnalytics = [
  { month: 'Yan', students: 120, completion: 78 },
  { month: 'Fev', students: 135, completion: 82 },
  { month: 'Mar', students: 142, completion: 85 },
  { month: 'Apr', students: 156, completion: 87 },
];

export function InstructorDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Yakunlangan</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Loyiha</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'assignment':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'webinar':
        return <Video className="h-4 w-4 text-purple-600" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={instructorData.avatar} alt={instructorData.name} />
            <AvatarFallback>
              {instructorData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Xush kelibsiz, {instructorData.name}!</h1>
            <p className="text-muted-foreground">
              {instructorData.department} • Reyting: {instructorData.rating} ⭐
            </p>
          </div>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yangi Kurs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jami Talabalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructorData.totalStudents}</div>
            <div className="text-xs text-muted-foreground">Barcha kurslarda</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Faol Kurslar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructorData.activeCourses}</div>
            <div className="text-xs text-muted-foreground">Davom etmoqda</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Yakunlangan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructorData.completedCourses}</div>
            <div className="text-xs text-muted-foreground">Kurslar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Reyting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{instructorData.rating}</div>
            <div className="text-xs text-muted-foreground">5.0 dan</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="courses">Kurslarim</TabsTrigger>
          <TabsTrigger value="students">Talabalar</TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Kurslar Jarayoni</CardTitle>
                <CardDescription>Faol kurslar bo'yicha o'zlashtirish</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myCourses.map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-sm text-muted-foreground">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{course.students} talaba</span>
                      <span>O'rtacha: {course.avgGrade}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Yaqinlashayotgan Vazifalar</CardTitle>
                <CardDescription>Rejalashtirilgan imtihon va topshiriqlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {getTaskTypeIcon(task.type)}
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">{task.course}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{task.date}</div>
                        <div className="text-xs text-muted-foreground">{task.students} talaba</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Student Activity */}
          <Card>
            <CardHeader>
              <CardTitle>So'nggi Talaba Faolligi</CardTitle>
              <CardDescription>Eng faol talabalar va ularning natijalari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.course}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{student.progress}%</div>
                        <div className="text-xs text-muted-foreground">Jarayon</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">{student.grade}</div>
                        <div className="text-xs text-muted-foreground">Baho</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{student.lastActivity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.students} talaba</CardDescription>
                    </div>
                    {getStatusBadge(course.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Kurs jarayoni</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">O'rtacha baho</div>
                      <div className="font-medium text-green-600">{course.avgGrade}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Yakunlash</div>
                      <div className="font-medium">{course.completionRate}%</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="text-muted-foreground">Muddat</div>
                    <div>{course.startDate} - {course.endDate}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" size="sm">
                      <Eye className="h-4 w-4" />
                      Ko'rish
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
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

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Talabalar Ro'yxati</CardTitle>
              <CardDescription>Barcha kurslaridagi talabalar</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talaba</TableHead>
                    <TableHead>Kurs</TableHead>
                    <TableHead>Jarayon</TableHead>
                    <TableHead>Baho</TableHead>
                    <TableHead>Oxirgi Faollik</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar} alt={student.name} />
                            <AvatarFallback>
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="h-2 w-16" />
                          <span className="text-sm">{student.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-green-600">
                          {student.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {student.lastActivity}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  O'rtacha Yakunlash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">78%</div>
                <div className="text-xs text-muted-foreground">Barcha kurslarda</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Talabalar Faolligi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">92%</div>
                <div className="text-xs text-muted-foreground">Haftalik</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  O'rtacha Baho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">4.3</div>
                <div className="text-xs text-muted-foreground">5.0 dan</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">4.8</div>
                <div className="text-xs text-muted-foreground">Talabalar baholashi</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kurslar Statistikasi</CardTitle>
              <CardDescription>Har bir kurs bo'yicha batafsil ma'lumot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">{course.students} talaba</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{course.progress}%</div>
                        <div className="text-xs text-muted-foreground">Jarayon</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{course.avgGrade}</div>
                        <div className="text-xs text-muted-foreground">O'rtacha</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{course.completionRate}%</div>
                        <div className="text-xs text-muted-foreground">Yakunlash</div>
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