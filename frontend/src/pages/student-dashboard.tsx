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
    Upload, 
    Shield,
    AlertTriangle
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
import {
  useDashboardStats,
  useRecentCourses,
  useUpcomingAssignments,
  useUpcomingTests,
  useRecentActivity,
  useNotificationSummary
} from '@/hooks/dashboard/useDashboard';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { DashboardStatsSkeleton } from '@/components/ui/skeletons/DashboardStatsSkeleton';
import { handleApiError } from '@/utils/error-handler';
import { useLoadingTransition } from '@/hooks/useLoadingTransition';
import { ErrorBoundaryTest } from '@/components/error-boundary-test';
import { useAuth } from '@/contexts/auth-context';

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


export function StudentDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch dashboard data from API
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: courses, isLoading: coursesLoading, error: coursesError } = useRecentCourses();
  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError } = useUpcomingAssignments();
  const { data: tests, isLoading: testsLoading, error: testsError } = useUpcomingTests();
  const { data: activity, isLoading: activityLoading, error: activityError } = useRecentActivity();
  const { data: notificationSummary, isLoading: notificationsLoading, error: notificationsError } = useNotificationSummary();
  const { data: notificationsList = [] } = useNotifications();

  // Apply loading transition with minimum 300ms display time (AC 9.7)
  const showStatsLoading = useLoadingTransition(statsLoading);
  const showCoursesLoading = useLoadingTransition(coursesLoading);
  const showAssignmentsLoading = useLoadingTransition(assignmentsLoading);
  const showTestsLoading = useLoadingTransition(testsLoading);

  const displayName = user?.fullName?.trim() || user?.username || 'Talaba';
  const studentData = {
    name: displayName,
    studentId: user?.username || '—',
    avatar: user?.photo || '',
    gpa: stats?.gpa || 0,
    totalCredits: stats?.totalCredits || 0,
    completedCourses: stats?.completedCourses || 0,
    activeCourses: stats?.activeCourses || 0,
    achievements: ['JavaScript Master', 'Perfect Attendance'],
    currentStreak: stats?.learningStreak || 0,
    totalHours: 120,
    thisWeekHours: 15,
    rank: 5,
    totalStudents: 245,
  };

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

  // Show loading skeleton while stats are loading (with fade-in/out animation)
  if (showStatsLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        <DashboardStatsSkeleton count={4} />
      </div>
    );
  }

  // Show error message if stats failed to load
  if (statsError) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Xatolik yuz berdi
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              {statsError instanceof Error ? statsError.message : "Ma'lumotlarni yuklab bo'lmadi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => refetchStats()} 
              variant="outline"
              className="gap-2"
              disabled={statsLoading}
            >
              <AlertCircle className="h-4 w-4" />
              {statsLoading ? "Yuklanmoqda..." : "Qayta urinish"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* ErrorBoundary Test - Only in Development */}
      {import.meta.env.DEV && (
        <ErrorBoundaryTest />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0">
            <AvatarImage src={studentData.avatar} alt={studentData.name} />
            <AvatarFallback>
              {studentData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight truncate">
              Xush kelibsiz, {studentData.name}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {studentData.studentId} • GPA: {studentData.gpa} • #{studentData.rank}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {studentData.thisWeekHours}h bu hafta
              </Badge>
              <Badge className="bg-green-100 text-green-800 text-xs">
                {studentData.currentStreak} kun
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">
              2
            </span>
          </Button>
          <Button className="gap-2 text-sm h-8 sm:h-9 px-3 sm:px-4">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Shaxsiy Kabinet</span>
            <span className="sm:hidden">Kabinet</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Faol Kurslar
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-0.5">{studentData.activeCourses}</div>
            <div className="text-xs text-muted-foreground">Davom etmoqda</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Yakunlangan
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-0.5">{studentData.completedCourses}</div>
            <div className="text-xs text-muted-foreground">Kurslar</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Kreditlar
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-0.5">{studentData.totalCredits}</div>
            <div className="text-xs text-muted-foreground">Kredit</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                GPA
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 mb-0.5">{studentData.gpa}</div>
            <div className="text-xs text-muted-foreground">5.0 dan</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            Tezkor Amallar
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Eng ko'p ishlatiladigan funksiyalar
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-16 sm:h-20 flex-col gap-1.5 sm:gap-2 hover:scale-105 transition-all duration-200"
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-[10px] sm:text-xs text-center leading-tight">{action.title}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pb-1">
          <TabsList className="grid min-w-[480px] w-full grid-cols-6">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Umumiy</TabsTrigger>
            <TabsTrigger value="courses" className="text-xs sm:text-sm">Kurslarim</TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs sm:text-sm">Vazifalar</TabsTrigger>
            <TabsTrigger value="grades" className="text-xs sm:text-sm">Baholar</TabsTrigger>
            <TabsTrigger value="exams" className="text-xs sm:text-sm">Imtihonlar</TabsTrigger>
            <TabsTrigger value="resources" className="text-xs sm:text-sm">Resurslar</TabsTrigger>
          </TabsList>
        </div>

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
                {showCoursesLoading ? (
                  <div className="space-y-4 animate-pulse-loading">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-2 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded" />
                  </div>
                ) : coursesError ? (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Ma'lumotlarni yuklab bo'lmadi
                  </div>
                ) : courses && courses.length > 0 ? (
                  courses.filter(course => course.status === 'active').map((course) => (
                    <div key={course.id} className="space-y-2 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{course.title}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{course.grade || 'N/A'}</Badge>
                          <span className="text-sm text-muted-foreground">{course.progress}%</span>
                        </div>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        Keyingi: {course.nextLesson?.title || 'Mavjud emas'}
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
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Faol kurslar mavjud emas
                  </div>
                )}
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
                  {notificationsList.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">Bildirishnomalar yo'q</p>
                  ) : (
                    notificationsList.slice(0, 3).map((notification) => (
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
                          <span className="text-xs text-muted-foreground">{notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('uz') : ''}</span>
                        </div>
                      </div>
                    ))
                  )}
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
                {showAssignmentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-200 animate-pulse-loading rounded" />
                    ))}
                  </div>
                ) : assignmentsError ? (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Ma'lumotlarni yuklab bo'lmadi
                  </div>
                ) : assignments && assignments.length > 0 ? (
                  assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded').map((assignment) => (
                    <div key={assignment.id} className={`p-4 border-l-4 ${getPriorityColor(assignment.priority)} bg-muted/50 rounded-r-lg animate-fade-in`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{assignment.title}</h4>
                            {assignment.priority === 'high' && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {new Date(assignment.dueDate).toLocaleDateString('uz-UZ')}
                          </div>
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          Ko'rish
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Yaqinlashayotgan topshiriqlar yo'q
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg" />
                  <CardContent className="space-y-3 p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-2 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : coursesError ? (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400">Kurslarni yuklab bo'lmadi</p>
              </CardContent>
            </Card>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105 overflow-hidden">
                  <div className="relative">
                    <img 
                      src={course.imageUrl || 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=300'} 
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
                        <span className="font-medium">{course.nextLesson.title}</span>
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
                        <span className="font-medium">
                          {new Date(course.dueDate).toLocaleDateString('uz-UZ')}
                        </span>
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
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Kurslar mavjud emas</p>
              </CardContent>
            </Card>
          )}
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
              {assignmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
              ) : assignmentsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-red-600 dark:text-red-400">Topshiriqlarni yuklab bo'lmadi</p>
                </div>
              ) : assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className={`p-4 border-l-4 ${getPriorityColor(assignment.priority)} bg-muted/50 rounded-r-lg`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{assignment.title}</h4>
                            {assignment.priority === 'high' && (
                              <Badge className="bg-red-100 text-red-800 text-xs">Muhim</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Muddat: {new Date(assignment.dueDate).toLocaleDateString('uz-UZ')}</span>
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Topshiriqlar mavjud emas
                </div>
              )}
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
                  Baholar
                </div>
                <Badge className="bg-green-100 text-green-800">GPA: {studentData.gpa}</Badge>
              </CardTitle>
              <CardDescription>Fanlar bo'yicha joriy va yakuniy baholar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <Star className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">To'liq baholar sahifasiga o'ting</p>
                <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/student/grades'}>
                  <Eye className="h-4 w-4" />
                  Baholarni ko'rish
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-6">
          {testsLoading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-10 bg-gray-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : testsError ? (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400">Imtihonlarni yuklab bo'lmadi</p>
              </CardContent>
            </Card>
          ) : tests && tests.length > 0 ? (
            <div className="space-y-6">
              {tests.map((exam) => (
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
                    <CardDescription>{exam.courseName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{new Date(exam.date).toLocaleDateString('uz-UZ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{exam.startTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{exam.questionCount} savol</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{exam.duration} daq</span>
                      </div>
                    </div>
                    
                    {exam.proctoring && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                          ⚠️ Imtihon AI proctoring tizimi bilan nazorat qilinadi
                        </p>
                      </div>
                    )}
                    
                    <Button className="w-full gap-2" size="lg">
                      <GraduationCap className="h-4 w-4" />
                      Imtihon Boshlash
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Yaqinlashayotgan imtihonlar yo'q</p>
              </CardContent>
            </Card>
          )}

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