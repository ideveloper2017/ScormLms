import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Edit,
  Camera,
  Shield,
  Award,
  BookOpen,
  Clock,
  Target,
  Activity,
  Settings,
  Bell,
  Lock,
  Eye,
  Download,
  Upload,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  FileText,
  Video,
  MessageCircle,
  BarChart3,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
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

const studentProfile = {
  id: 'STU001',
  name: 'Alisher Karimov',
  email: 'alisher@student.uz',
  phone: '+998901234567',
  birthDate: '1998-05-15',
  address: 'Toshkent sh., Yunusobod t.',
  group: 'JS-2024-01',
  enrollmentDate: '2024-01-15',
  gpa: 4.2,
  totalCredits: 45,
  completedCourses: 3,
  activeCourses: 2,
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
  profileCompletion: 85,
  lastLogin: '2024-01-15 14:30',
  achievements: [
    { id: 1, name: 'JavaScript Master', icon: '🏆', date: '2024-01-10' },
    { id: 2, name: 'Perfect Attendance', icon: '📅', date: '2024-01-05' },
    { id: 3, name: 'First Course Complete', icon: '🎓', date: '2023-12-20' },
  ],
  learningStats: {
    totalHours: 120,
    thisWeekHours: 15,
    avgSessionTime: 45,
    streakDays: 12,
  },
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profileVisible: true,
      showProgress: true,
      showAchievements: true,
    },
    learning: {
      autoplay: true,
      subtitles: true,
      playbackSpeed: 1.0,
    }
  }
};

const recentActivities = [
  {
    id: 1,
    type: 'course_complete',
    title: 'Darsni yakunladingiz',
    description: 'JavaScript Asoslari - Dars 7: Funksiyalar',
    timestamp: '2 soat oldin',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    id: 2,
    type: 'assignment_submit',
    title: 'Topshiriq yuborildi',
    description: 'React Components loyihasi',
    timestamp: '1 kun oldin',
    icon: FileText,
    color: 'text-blue-600',
  },
  {
    id: 3,
    type: 'exam_passed',
    title: 'Imtihon topshirildi',
    description: 'HTML/CSS yakuniy test - 95 ball',
    timestamp: '3 kun oldin',
    icon: GraduationCap,
    color: 'text-purple-600',
  },
  {
    id: 4,
    type: 'achievement',
    title: 'Yangi yutuq',
    description: 'JavaScript Master unvoni olindi',
    timestamp: '1 hafta oldin',
    icon: Award,
    color: 'text-yellow-600',
  },
];

const learningGoals = [
  {
    id: 1,
    title: 'JavaScript kursini yakunlash',
    progress: 85,
    target: 100,
    deadline: '2024-02-15',
    status: 'on-track',
  },
  {
    id: 2,
    title: 'React asoslarini o\'rganish',
    progress: 60,
    target: 100,
    deadline: '2024-03-01',
    status: 'on-track',
  },
  {
    id: 3,
    title: 'Portfolio loyihasi yaratish',
    progress: 30,
    target: 100,
    deadline: '2024-03-15',
    status: 'behind',
  },
];

export function StudentCabinet() {
  const [selectedTab, setSelectedTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(studentProfile);

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600';
      case 'behind':
        return 'text-red-600';
      case 'ahead':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getGoalStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track':
        return <Badge className="bg-green-100 text-green-800">Vaqtida</Badge>;
      case 'behind':
        return <Badge className="bg-red-100 text-red-800">Kechikish</Badge>;
      case 'ahead':
        return <Badge className="bg-blue-100 text-blue-800">Oldinda</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={studentProfile.avatar} alt={studentProfile.name} />
              <AvatarFallback className="text-2xl">
                {studentProfile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="icon" 
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Profil Rasmini O'zgartirish</DialogTitle>
                  <DialogDescription>
                    Yangi profil rasmini yuklang
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-center">
                    <Avatar className="h-32 w-32 mx-auto mb-4">
                      <AvatarImage src={studentProfile.avatar} alt={studentProfile.name} />
                      <AvatarFallback className="text-4xl">
                        {studentProfile.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Button className="gap-2">
                      <Upload className="h-4 w-4" />
                      Rasm Yuklash
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{studentProfile.name}</h1>
            <p className="text-muted-foreground">
              {studentProfile.id} • {studentProfile.group} • GPA: {studentProfile.gpa}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800">Faol Talaba</Badge>
              <Badge variant="outline">{studentProfile.completedCourses} kurs yakunlangan</Badge>
            </div>
          </div>
        </div>
        
        <Button 
          variant={isEditing ? "default" : "outline"} 
          className="gap-2"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit className="h-4 w-4" />
          {isEditing ? 'Saqlash' : 'Tahrirlash'}
        </Button>
      </div>

      {/* Profile Completion */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Profil To'ldirilishi</h3>
              <p className="text-sm text-muted-foreground">
                Profilingizni to'liq to'ldiring va qo'shimcha imkoniyatlardan foydalaning
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {studentProfile.profileCompletion}%
            </div>
          </div>
          <Progress value={studentProfile.profileCompletion} className="h-3" />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Bu Hafta
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{studentProfile.learningStats.thisWeekHours}h</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              O'quv vaqti
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Jami Soatlar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <Activity className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{studentProfile.learningStats.totalHours}h</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-blue-500" />
              Umumiy o'quv
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                O'rtacha Sessiya
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{studentProfile.learningStats.avgSessionTime}m</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-purple-500" />
              Daqiqa
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Ketma-ketlik
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                <Award className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">{studentProfile.learningStats.streakDays}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 text-orange-500 fill-current" />
              Kun ketma-ket
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="academic">Akademik</TabsTrigger>
          <TabsTrigger value="achievements">Yutuqlar</TabsTrigger>
          <TabsTrigger value="goals">Maqsadlar</TabsTrigger>
          <TabsTrigger value="activity">Faoliyat</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Shaxsiy Ma'lumotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>To'liq ism</Label>
                    <Input 
                      value={editedProfile.name}
                      disabled={!isEditing}
                      onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Talaba ID</Label>
                    <Input value={studentProfile.id} disabled />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={editedProfile.email}
                      disabled={!isEditing}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input 
                      value={editedProfile.phone}
                      disabled={!isEditing}
                      onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tug'ilgan sana</Label>
                    <Input 
                      type="date"
                      value={editedProfile.birthDate}
                      disabled={!isEditing}
                      onChange={(e) => setEditedProfile({...editedProfile, birthDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Guruh</Label>
                    <Input value={studentProfile.group} disabled />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Manzil</Label>
                  <Textarea 
                    value={editedProfile.address}
                    disabled={!isEditing}
                    onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Xavfsizlik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Joriy parol</Label>
                  <Input type="password" placeholder="Joriy parolni kiriting" />
                </div>
                
                <div className="space-y-2">
                  <Label>Yangi parol</Label>
                  <Input type="password" placeholder="Yangi parolni kiriting" />
                </div>
                
                <div className="space-y-2">
                  <Label>Parolni tasdiqlash</Label>
                  <Input type="password" placeholder="Yangi parolni qaytaring" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Ikki faktorli autentifikatsiya</Label>
                    <p className="text-sm text-muted-foreground">
                      Qo'shimcha xavfsizlik uchun 2FA yoqish
                    </p>
                  </div>
                  <Switch />
                </div>

                <Button className="w-full gap-2">
                  <Lock className="h-4 w-4" />
                  Parolni Yangilash
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Akademik Ma'lumotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{studentProfile.gpa}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">GPA</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{studentProfile.totalCredits}</div>
                    <div className="text-sm text-green-700 dark:text-green-400">Kreditlar</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ro'yxatdan o'tgan sana:</span>
                    <span className="text-sm font-medium">{studentProfile.enrollmentDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Yakunlangan kurslar:</span>
                    <span className="text-sm font-medium">{studentProfile.completedCourses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Faol kurslar:</span>
                    <span className="text-sm font-medium">{studentProfile.activeCourses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Oxirgi kirish:</span>
                    <span className="text-sm font-medium">{studentProfile.lastLogin}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  O'quv Statistikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Jami o'quv vaqti</span>
                    <span className="font-bold text-blue-600">{studentProfile.learningStats.totalHours}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bu hafta</span>
                    <span className="font-bold text-green-600">{studentProfile.learningStats.thisWeekHours}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">O'rtacha sessiya</span>
                    <span className="font-bold text-purple-600">{studentProfile.learningStats.avgSessionTime}m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ketma-ketlik</span>
                    <span className="font-bold text-orange-600">{studentProfile.learningStats.streakDays} kun</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Akademik Ma'lumotnoma
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentProfile.achievements.map((achievement) => (
              <Card key={achievement.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{achievement.icon}</div>
                  <h3 className="font-semibold mb-2">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Olindi: {achievement.date}
                  </p>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Yutuq
                  </Badge>
                </CardContent>
              </Card>
            ))}
            
            {/* Locked Achievements */}
            <Card className="opacity-60 border-dashed">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4 grayscale">🔒</div>
                <h3 className="font-semibold mb-2">React Specialist</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  React kursini yakunlang
                </p>
                <Badge variant="outline">
                  Qulflangan
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="opacity-60 border-dashed">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4 grayscale">🔒</div>
                <h3 className="font-semibold mb-2">Full Stack Developer</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  5 ta kursni yakunlang
                </p>
                <Badge variant="outline">
                  Qulflangan
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">O'quv Maqsadlarim</h2>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Maqsad
            </Button>
          </div>

          <div className="space-y-4">
            {learningGoals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Muddat: {goal.deadline}
                      </p>
                    </div>
                    {getGoalStatusBadge(goal.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Jarayon</span>
                      <span className={getGoalStatusColor(goal.status)}>
                        {goal.progress}% / {goal.target}%
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-3" />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Batafsil
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                So'nggi Faoliyatlar
              </CardTitle>
              <CardDescription>
                Oxirgi o'quv faoliyatlari va yutuqlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                        <Icon className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Bildirishnoma Sozlamalari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email bildirishnomalar</Label>
                    <p className="text-sm text-muted-foreground">
                      Yangi darslar va topshiriqlar haqida email olish
                    </p>
                  </div>
                  <Switch defaultChecked={studentProfile.preferences.notifications.email} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Push bildirishnomalar</Label>
                    <p className="text-sm text-muted-foreground">
                      Brauzer orqali bildirishnomalar
                    </p>
                  </div>
                  <Switch defaultChecked={studentProfile.preferences.notifications.push} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">SMS bildirishnomalar</Label>
                    <p className="text-sm text-muted-foreground">
                      Muhim xabarlar uchun SMS
                    </p>
                  </div>
                  <Switch defaultChecked={studentProfile.preferences.notifications.sms} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Maxfiylik Sozlamalari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Profil ko'rinishi</Label>
                    <p className="text-sm text-muted-foreground">
                      Boshqa talabalar profilingizni ko'ra olsinmi
                    </p>
                  </div>
                  <Switch defaultChecked={studentProfile.preferences.privacy.profileVisible} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Jarayon ko'rsatish</Label>
                    <p className="text-sm text-muted-foreground">
                      O'quv jarayoningizni boshqalarga ko'rsatish
                    </p>
                  </div>
                  <Switch defaultChecked={studentProfile.preferences.privacy.showProgress} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Yutuqlar ko'rsatish</Label>
                    <p className="text-sm text-muted-foreground">
                      Yutuqlaringizni boshqalarga ko'rsatish
                    </p>
                  </div>
                  <Switch defaultChecked={studentProfile.preferences.privacy.showAchievements} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                O'quv Sozlamalari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Avtomatik ijro</Label>
                  <p className="text-sm text-muted-foreground">
                    Video darslarni avtomatik boshlash
                  </p>
                </div>
                <Switch defaultChecked={studentProfile.preferences.learning.autoplay} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Subtitrlar</Label>
                  <p className="text-sm text-muted-foreground">
                    Video darslarda subtitrlarni ko'rsatish
                  </p>
                </div>
                <Switch defaultChecked={studentProfile.preferences.learning.subtitles} />
              </div>
              
              <div className="space-y-2">
                <Label>Ijro tezligi</Label>
                <Select defaultValue={studentProfile.preferences.learning.playbackSpeed.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2.0">2.0x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
