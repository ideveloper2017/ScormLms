import { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp,
  Shield,
  Monitor,
  Activity,
  AlertTriangle,
  Settings,
  Plus,
  Eye,
  BarChart3,
  Clock,
  Award,
  CheckCircle,
  UserCheck,
  Database,
  Server
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const systemStats = {
  totalUsers: 2869,
  activeUsers: 2756,
  totalCourses: 156,
  activeCourses: 142,
  totalExams: 89,
  scormPackages: 234,
  systemUptime: 99.8,
  serverLoad: 67,
};

const recentActivities = [
  {
    id: 1,
    user: 'Alisher Karimov',
    action: 'Kursni yakunladi',
    details: 'JavaScript Asoslari - 95 ball',
    timestamp: '2 soat oldin',
    type: 'success',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 2,
    user: 'Dr. Malika Tosheva',
    action: 'Yangi kurs yaratdi',
    details: 'Machine Learning Asoslari',
    timestamp: '4 soat oldin',
    type: 'info',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 3,
    user: 'System',
    action: 'Xavfsizlik ogohlantirishi',
    details: 'Muvaffaqiyatsiz kirish urinishi aniqlandi',
    timestamp: '6 soat oldin',
    type: 'warning',
    avatar: null,
  },
  {
    id: 4,
    user: 'Bobur Rahimov',
    action: 'Imtihon topshirdi',
    details: 'React Development - 87 ball',
    timestamp: '1 kun oldin',
    type: 'success',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
];

const systemMetrics = [
  { name: 'Yan', users: 2400, courses: 120, exams: 65 },
  { name: 'Fev', users: 2500, courses: 135, exams: 72 },
  { name: 'Mar', users: 2650, courses: 142, exams: 78 },
  { name: 'Apr', users: 2750, courses: 148, exams: 85 },
  { name: 'May', users: 2820, courses: 152, exams: 87 },
  { name: 'Iyun', users: 2869, courses: 156, exams: 89 },
];

const topInstructors = [
  {
    id: 1,
    name: 'Dr. Aziz Karimov',
    department: 'Dasturlash',
    students: 156,
    courses: 3,
    rating: 4.9,
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 2,
    name: 'Prof. Malika Tosheva',
    department: 'Ma\'lumotlar tahlili',
    students: 234,
    courses: 4,
    rating: 4.8,
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 3,
    name: 'Bobur Rahimov',
    department: 'Web Development',
    students: 189,
    courses: 2,
    rating: 4.7,
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
];

const systemAlerts = [
  {
    id: 1,
    type: 'warning',
    title: 'Server yuklanganligi yuqori',
    message: 'Server yuklanishi 85% dan oshdi',
    timestamp: '10 daqiqa oldin',
  },
  {
    id: 2,
    type: 'info',
    title: 'Yangilanish mavjud',
    message: 'SCORM engine uchun yangilanish',
    timestamp: '2 soat oldin',
  },
  {
    id: 3,
    type: 'success',
    title: 'Backup yakunlandi',
    message: 'Ma\'lumotlar bazasi backup muvaffaqiyatli',
    timestamp: '4 soat oldin',
  },
];

export function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administrator Dashboard</h1>
          <p className="text-muted-foreground">
            Tizim boshqaruvi va monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Sozlamalar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi Foydalanuvchi
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jami Foydalanuvchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {systemStats.activeUsers} faol
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Kurslar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalCourses}</div>
            <div className="text-xs text-muted-foreground">
              {systemStats.activeCourses} faol
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              SCORM Paketlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.scormPackages}</div>
            <div className="text-xs text-muted-foreground">98% uyg'un</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Server className="h-4 w-4" />
              Tizim Holati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats.systemUptime}%</div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="users">Foydalanuvchilar</TabsTrigger>
          <TabsTrigger value="system">Tizim</TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
          <TabsTrigger value="security">Xavfsizlik</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Tizim Ishlashi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Server yuklanganligi</span>
                    <span className="text-sm">{systemStats.serverLoad}%</span>
                  </div>
                  <Progress value={systemStats.serverLoad} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SCORM Engine</span>
                    <Badge className="bg-green-100 text-green-800">Faol</Badge>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Proctoring AI</span>
                    <Badge className="bg-blue-100 text-blue-800">Ishlayapti</Badge>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>So'nggi Faoliyatlar</CardTitle>
                <CardDescription>Tizim faolligi va foydalanuvchi harakatlari</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      {activity.avatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.avatar} alt={activity.user} />
                          <AvatarFallback>
                            {activity.user.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Settings className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <span className="font-medium text-sm">{activity.action}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Tizim Ogohlantirishlari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 border-l-4 rounded-r-lg ${getAlertColor(alert.type)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Foydalanuvchi Statistikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Jami foydalanuvchilar</span>
                  <span className="font-bold">{systemStats.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Faol foydalanuvchilar</span>
                  <span className="font-bold text-green-600">{systemStats.activeUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Administratorlar</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>O'qituvchilar</span>
                  <span className="font-bold">45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Talabalar</span>
                  <span className="font-bold">2,812</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Eng Yaxshi O'qituvchilar</CardTitle>
                <CardDescription>Yuqori reytingli o'qituvchilar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topInstructors.map((instructor) => (
                    <div key={instructor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={instructor.avatar} alt={instructor.name} />
                          <AvatarFallback>
                            {instructor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{instructor.name}</div>
                          <div className="text-sm text-muted-foreground">{instructor.department}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{instructor.rating}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {instructor.students} talaba • {instructor.courses} kurs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Ma'lumotlar Bazasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Jami yozuvlar</span>
                  <span className="font-bold">1,247,892</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ma'lumotlar hajmi</span>
                  <span className="font-bold">2.4 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Oxirgi backup</span>
                  <span className="font-bold text-green-600">4 soat oldin</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Holat</span>
                  <Badge className="bg-green-100 text-green-800">Sog'lom</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  SCORM Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Versiya</span>
                  <span className="font-bold">2004 4th Edition</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Faol paketlar</span>
                  <span className="font-bold">{systemStats.scormPackages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Uyg'unlik</span>
                  <span className="font-bold text-green-600">98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Holat</span>
                  <Badge className="bg-green-100 text-green-800">Faol</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tizim Statistikasi</CardTitle>
              <CardDescription>Oylik o'sish va faollik ko'rsatkichlari</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Foydalanuvchilar"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="courses" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Kurslar"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="exams" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Imtihonlar"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Oylik O'sish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+8.2%</div>
                <div className="text-xs text-muted-foreground">Foydalanuvchilar</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Faollik Darajasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">96%</div>
                <div className="text-xs text-muted-foreground">Kunlik faol</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kurs Yakunlash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">84%</div>
                <div className="text-xs text-muted-foreground">O'rtacha</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tizim Samaradorligi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">99.8%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Xavfsizlik Holati
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>2FA yoqilgan</span>
                  <span className="font-bold text-green-600">1,234 foydalanuvchi</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Faol sessiyalar</span>
                  <span className="font-bold">2,156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Muvaffaqiyatsiz kirish</span>
                  <span className="font-bold text-red-600">23 (bugun)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Oxirgi xavfsizlik skaneri</span>
                  <span className="font-bold text-green-600">2 soat oldin</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xavfsizlik Loglar</CardTitle>
                <CardDescription>So'nggi xavfsizlik hodisalari</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-l-red-500">
                    <div className="font-medium text-red-800 dark:text-red-400">
                      Shubhali faollik aniqlandi
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      IP: 203.0.113.1 - 15 daqiqa oldin
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-l-yellow-500">
                    <div className="font-medium text-yellow-800 dark:text-yellow-400">
                      Ko'p muvaffaqiyatsiz kirish
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      admin@test.com - 1 soat oldin
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-l-green-500">
                    <div className="font-medium text-green-800 dark:text-green-400">
                      Xavfsizlik yangilanishi
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Tizim yangilanishi o'rnatildi - 4 soat oldin
                    </div>
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