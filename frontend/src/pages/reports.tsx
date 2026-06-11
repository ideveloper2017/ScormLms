import { 
  BarChart3, 
  Download, 
  Filter,
  TrendingUp,
  Users,
  BookOpen,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

const monthlyData = [
  { name: 'Yan', students: 400, courses: 24, exams: 12 },
  { name: 'Fev', students: 300, courses: 13, exams: 8 },
  { name: 'Mar', students: 500, courses: 28, exams: 15 },
  { name: 'Apr', students: 780, courses: 39, exams: 22 },
  { name: 'May', students: 890, courses: 48, exams: 28 },
  { name: 'Iyun', students: 1200, courses: 56, exams: 35 },
];

const courseCompletionData = [
  { name: 'JavaScript', completed: 85, total: 100 },
  { name: 'React', completed: 72, total: 90 },
  { name: 'Python', completed: 95, total: 120 },
  { name: 'Data Science', completed: 45, total: 60 },
];

const examScoreData = [
  { range: '90-100', count: 45, color: '#10b981' },
  { range: '80-89', count: 78, color: '#3b82f6' },
  { range: '70-79', count: 52, color: '#f59e0b' },
  { range: '60-69', count: 23, color: '#ef4444' },
  { range: '<60', count: 12, color: '#6b7280' },
];

export function Reports() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hisobotlar</h1>
          <p className="text-muted-foreground">
            LMS platformasi bo'yicha batafsil tahlil va statistika
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select defaultValue="last-month">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Vaqt oralig'i" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-week">Oxirgi hafta</SelectItem>
              <SelectItem value="last-month">Oxirgi oy</SelectItem>
              <SelectItem value="last-quarter">Oxirgi chorak</SelectItem>
              <SelectItem value="last-year">Oxirgi yil</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Eksport
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                Talabalar soni
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600 mb-1">2,847</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18% o'sish
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-violet-200 dark:border-violet-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                Kurslar soni
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600 mb-1">156</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12 yangi
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                Yakunlash darajasi
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-md">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600 mb-1">84%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5% yaxshilash
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                O'rtacha ball
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">87.5</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.3 o'sish
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Oylik O'sish</CardTitle>
            <CardDescription>Talabalar va kurslar statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Talabalar"
                />
                <Line 
                  type="monotone" 
                  dataKey="courses" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Kurslar"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Kurs Yakunlash</CardTitle>
            <CardDescription>Kurslar bo'yicha yakunlash statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#10b981" name="Yakunlangan" />
                <Bar dataKey="total" fill="#e5e7eb" name="Jami" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Imtihon Natijalari</CardTitle>
            <CardDescription>Ball taqsimoti</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={examScoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {examScoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {examScoreData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.range}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Eng Yaxshi Kurslar</CardTitle>
            <CardDescription>Yuqori baholangan kurslar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'JavaScript Asoslari', rating: 4.9, students: 245 },
              { name: 'React Development', rating: 4.8, students: 189 },
              { name: 'Python Dasturlash', rating: 4.7, students: 312 },
              { name: 'Data Science', rating: 4.6, students: 156 },
            ].map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium">{course.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {course.students} talaba
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  ⭐ {course.rating}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>So'nggi Faoliyat</CardTitle>
            <CardDescription>Tizim faolligi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { 
                action: 'Yangi kurs qo\'shildi', 
                details: 'Machine Learning Asoslari',
                time: '2 soat oldin',
                type: 'course'
              },
              { 
                action: 'Imtihon yakunlandi', 
                details: '45 talaba ishtirok etdi',
                time: '4 soat oldin',
                type: 'exam'
              },
              { 
                action: 'Yangi talaba ro\'yxatdan o\'tdi', 
                details: 'Aziza Karimova',
                time: '6 soat oldin',
                type: 'student'
              },
              { 
                action: 'SCORM paketi yuklandi', 
                details: 'Web Development kursi',
                time: '1 kun oldin',
                type: 'scorm'
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'course' ? 'bg-blue-500' :
                  activity.type === 'exam' ? 'bg-green-500' :
                  activity.type === 'student' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{activity.action}</div>
                  <div className="text-sm text-muted-foreground">{activity.details}</div>
                  <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}