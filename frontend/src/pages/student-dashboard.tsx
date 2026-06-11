import { useState } from 'react';
import {
    BookOpen,
    Play,
    Clock,
    Award,
    TrendingUp,
    Calendar,
    CheckCircle,
    AlertCircle,
    User,
    Star,
    Download,
    Eye,
    BarChart3,
    Target,
    Activity,
    Users,
    GraduationCap,
    FileText,
    Video,
    MessageCircle,
    Home,
    Bell,
    Settings,
    Zap,
    Bookmark,
    Heart,
    Share2,
    Filter,
    Search,
    Plus,
    ArrowRight,
    ExternalLink,
    Lightbulb,
    Coffee,
    Music,
    Headphones,
    Upload, Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';

const studentData = {
  name: 'Alisher Karimov',
  email: 'alisher@student.uz',
  studentId: 'STU001',
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
  gpa: 4.2,
  totalCredits: 45,
  completedCourses: 3,
  activeCourses: 2,
  achievements: ['JavaScript Master', 'Perfect Attendance'],
  currentStreak: 12,
  totalHours: 120,
  thisWeekHours: 15,
  rank: 5,
  totalStudents: 245,
};

const myCourses = [
  {
    id: 1,
    title: 'JavaScript Asoslari',
    instructor: 'Dr. Aziz Karimov',
    progress: 85,
    grade: 'A',
    status: 'active',
    nextLesson: 'Dars 8: Obyektlar',
    dueDate: '2024-01-20',
    image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 2,
    title: 'React Development',
    instructor: 'Prof. Malika Tosheva',
    progress: 60,
    grade: 'B+',
    status: 'active',
    nextLesson: 'Dars 5: Hooks',
    dueDate: '2024-01-25',
    image: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 3,
    title: 'HTML/CSS Asoslari',
    instructor: 'Bobur Rahimov',
    progress: 100,
    grade: 'A+',
    status: 'completed',
    nextLesson: null,
    dueDate: null,
    image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
];

const upcomingAssignments = [
  {
    id: 1,
    title: 'JavaScript Loyiha',
    course: 'JavaScript Asoslari',
    dueDate: '2024-01-20',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 2,
    title: 'React Component',
    course: 'React Development',
    dueDate: '2024-01-25',
    status: 'in-progress',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'CSS Animation',
    course: 'HTML/CSS Asoslari',
    dueDate: '2024-01-30',
    status: 'completed',
    priority: 'low',
  },
];

const recentGrades = [
  { course: 'JavaScript Asoslari', assignment: 'Dars 7 Test', grade: 'A', score: 95, date: '2024-01-15' },
  { course: 'React Development', assignment: 'Component Quiz', grade: 'B+', score: 87, date: '2024-01-12' },
  { course: 'HTML/CSS Asoslari', assignment: 'Final Project', grade: 'A+', score: 98, date: '2024-01-10' },
];

const upcomingExams = [
  {
    id: 1,
    title: 'JavaScript Yakuniy Imtihon',
    course: 'JavaScript Asoslari',
    date: '2024-01-22',
    time: '14:00',
    duration: '90 daqiqa',
    questions: 50,
    proctoring: true,
  },
  {
    id: 2,
    title: 'React Components Test',
    course: 'React Development',
    date: '2024-01-28',
    time: '10:00',
    duration: '60 daqiqa',
    questions: 30,
    proctoring: true,
  },
];

const quickActions = [
  { id: 1, title: 'Yangi Darsni Boshlash', icon: Play, color: 'bg-green-100 text-green-800', action: 'start-lesson' },
  { id: 2, title: 'Topshiriq Yuborish', icon: Upload, color: 'bg-blue-100 text-blue-800', action: 'submit-assignment' },
  { id: 3, title: 'O\'qituvchi bilan Bog\'lanish', icon: MessageCircle, color: 'bg-purple-100 text-purple-800', action: 'contact-teacher' },
  { id: 4, title: 'Shaxsiy Kabinet', icon: User, color: 'bg-orange-100 text-orange-800', action: 'personal-cabinet' },
];

const studyTips = [
  {
    id: 1,
    title: 'Kunlik o\'quv rejasi tuzing',
    description: 'Har kuni ma\'lum vaqtni o\'qishga ajrating',
    icon: Calendar,
    category: 'Vaqt boshqaruvi',
  },
  {
    id: 2,
    title: 'Amaliy loyihalar yarating',
    description: 'Nazariy bilimlarni amaliyotda qo\'llang',
    icon: Lightbulb,
    category: 'Amaliyot',
  },
  {
    id: 3,
    title: 'Tanaffus qiling',
    description: 'Har 45 daqiqada 10-15 daqiqa tanaffus',
    icon: Coffee,
    category: 'Salomatlik',
  },
];

const notifications = [
  {
    id: 1,
    title: 'Yangi dars mavjud',
    message: 'JavaScript Asoslari - Dars 8: Obyektlar',
    time: '10 daqiqa oldin',
    type: 'course',
    isRead: false,
  },
  {
    id: 2,
    title: 'Topshiriq muddati yaqinlashmoqda',
    message: 'React loyihasi - 2 kun qoldi',
    time: '2 soat oldin',
    type: 'assignment',
    isRead: false,
  },
  {
    id: 3,
    title: 'Imtihon e\'lon qilindi',
    message: 'JavaScript yakuniy imtihon - 22 yanvar',
    time: '1 kun oldin',
    type: 'exam',
    isRead: true,
  },
];

export function StudentDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Yakunlangan</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Kutilmoqda</Badge>;
      case 'in-progress':
        return <Badge className="bg-purple-100 text-purple-800">Jarayonda</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={studentData.avatar} alt={studentData.name} />
            <AvatarFallback>
              {studentData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Xush kelibsiz, {studentData.name}!</h1>
            <p className="text-muted-foreground">
              {studentData.studentId} • GPA: {studentData.gpa} • Reyting: #{studentData.rank}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-blue-100 text-blue-800">
                {studentData.thisWeekHours}h bu hafta
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                {studentData.currentStreak} kun ketma-ket
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              2
            </span>
          </Button>
          <Button className="gap-2">
            <User className="h-4 w-4" />
            Shaxsiy Kabinet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Faol Kurslar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{studentData.activeCourses}</div>
            <div className="text-xs text-muted-foreground">Davom etmoqda</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Yakunlangan
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{studentData.completedCourses}</div>
            <div className="text-xs text-muted-foreground">Kurslar</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Jami Kreditlar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Award className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{studentData.totalCredits}</div>
            <div className="text-xs text-muted-foreground">Kredit</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                GPA
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 mb-1">{studentData.gpa}</div>
            <div className="text-xs text-muted-foreground">5.0 dan</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Tezkor Amallar
          </CardTitle>
          <CardDescription>
            Eng ko'p ishlatiladigan funksiyalar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:scale-105 transition-all duration-200"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">{action.title}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="courses">Kurslarim</TabsTrigger>
          <TabsTrigger value="assignments">Vazifalar</TabsTrigger>
          <TabsTrigger value="grades">Baholar</TabsTrigger>
          <TabsTrigger value="exams">Imtihonlar</TabsTrigger>
          <TabsTrigger value="resources">Resurslar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  O'quv Jarayoni
                </CardTitle>
                <CardDescription>Faol kurslar bo'yicha o'zlashtirish</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myCourses.filter(course => course.status === 'active').map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{course.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{course.grade}</Badge>
                        <span className="text-sm text-muted-foreground">{course.progress}%</span>
                      </div>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      Keyingi: {course.nextLesson}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1">
                        <Play className="h-3 w-3" />
                        Davom etish
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  So'nggi Yutuqlar
                </CardTitle>
                <CardDescription>Erishgan muvaffaqiyatlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{achievement}</div>
                        <div className="text-sm text-muted-foreground">Yangi yutuq!</div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2 mt-4">
                    <Eye className="h-4 w-4" />
                    Barcha Yutuqlarni Ko'rish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Study Tips & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  O'quv Maslahatlari
                </CardTitle>
                <CardDescription>Samarali o'qish uchun tavsiyalar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studyTips.map((tip) => {
                    const Icon = tip.icon;
                    return (
                      <div key={tip.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-blue-600 mt-1" />
                          <div>
                            <h4 className="font-medium text-sm">{tip.title}</h4>
                            <p className="text-xs text-muted-foreground">{tip.description}</p>
                            <Badge variant="outline" className="text-xs mt-1">{tip.category}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Bildirishnomalar
                </CardTitle>
                <CardDescription>So'nggi xabarlar va yangilanishlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                      notification.type === 'course' ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                      notification.type === 'assignment' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                      'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    } ${!notification.isRead ? 'font-medium' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2 mt-4">
                    <Bell className="h-4 w-4" />
                    Barcha Bildirishnomalar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Yaqinlashayotgan Muddatlar
              </CardTitle>
              <CardDescription>Topshirish kerak bo'lgan vazifalar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAssignments.filter(a => a.status !== 'completed').map((assignment) => (
                  <div key={assignment.id} className={`p-4 border-l-4 ${getPriorityColor(assignment.priority)} bg-muted/50 rounded-r-lg`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{assignment.title}</h4>
                          {assignment.priority === 'high' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{assignment.course}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{assignment.dueDate}</div>
                        {getStatusBadge(assignment.status)}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        Ko'rish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105 overflow-hidden">
                <div className="relative">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(course.status)}
                  </div>
                  {course.grade && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90">
                        {course.grade}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-2 left-2">
                  <div className="flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    <Users className="h-3 w-3" />
                    <span>245 talaba</span>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.instructor}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Jarayon</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  
                  {course.nextLesson && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Keyingi: </span>
                      <span className="font-medium">{course.nextLesson}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      12 video
                    </div>
                  </div>
                  
                  {course.dueDate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Muddat: </span>
                      <span className="font-medium">{course.dueDate}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" size="sm">
                      <Play className="h-3 w-3" />
                      Davom etish
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

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                O'quv Resurslari
              </CardTitle>
              <CardDescription>Darsliklar, qo'llanmalar va qo'shimcha materiallar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4" />
                <p>O'quv resurslari tez orada qo'shiladi</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vazifalar</CardTitle>
              <CardDescription>Barcha topshiriqlar va ularning holati</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className={`p-4 border-l-4 ${getPriorityColor(assignment.priority)} bg-muted/50 rounded-r-lg`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{assignment.title}</h4>
                          {assignment.priority === 'high' && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Muhim</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{assignment.course}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Muddat: {assignment.dueDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment.status)}
                        <Button variant="outline" size="sm">
                          Ko'rish
                        </Button>
                      </div>
                    </div>
                    {assignment.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t">
                        <Button size="sm" className="gap-2">
                          <Upload className="h-3 w-3" />
                          Topshiriq Yuborish
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  So'nggi Baholar
                </div>
                <Badge className="bg-green-100 text-green-800">GPA: {studentData.gpa}</Badge>
              </CardTitle>
              <CardDescription>Oxirgi imtihon va topshiriq natijalari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{grade.assignment}</h4>
                        {grade.score >= 90 && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{grade.course}</p>
                      <p className="text-xs text-muted-foreground">{grade.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{grade.grade}</div>
                      <div className="text-sm text-muted-foreground">{grade.score} ball</div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-6">
          <div className="space-y-6">
            {upcomingExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{exam.title}</span>
                    {exam.proctoring && (
                      <Badge className="bg-blue-100 text-blue-800 gap-1">
                        <Shield className="h-3 w-3" />
                        Proctoring
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{exam.course}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.questions} savol</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.duration}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      ⚠️ Imtihon AI proctoring tizimi bilan nazorat qilinadi
                    </p>
                  </div>
                  
                  <Button className="w-full gap-2" size="lg">
                    <GraduationCap className="h-4 w-4" />
                    Imtihon Boshlash
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Exam Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Imtihon Ko'rsatmalari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <p>Imtihon davomida kameraning yoqilganligini ta'minlang</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <p>Yuzingizni kameraga to'g'ri qarash va harakat qilmaslik</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <p>Boshqa dasturlarni yopish va faqat imtihon oynasini ochiq qoldirish</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <p>Imtihon davomida boshqa odamlar yonida bo'lmaslik</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <p>Internet aloqasining barqarorligini ta'minlash</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                  ✅ Barcha talablarni bajarganingizdan so'ng imtihonni boshlashingiz mumkin
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}