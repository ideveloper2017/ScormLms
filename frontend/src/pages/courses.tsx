import { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Users,
  Clock,
  Star,
  Shield,
  Download,
  Play,
  Upload,
  Edit,
  Eye,
  Settings,
  FileText,
  Video,
  Link,
  CheckCircle,
  AlertCircle,
  Calendar,
  Globe,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
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
import { Switch } from '@/components/ui/switch.tsx';

const courses = [
  {
    id: 1,
    title: 'JavaScript Asoslari',
    description: 'Zamonaviy web dasturlash uchun JavaScript tilini o\'rganing',
    instructor: 'Alisher Karimov',
    students: 245,
    duration: '8 soat',
    rating: 4.8,
    progress: 75,
    scormCompliant: true,
    category: 'Dasturlash',
    level: 'Boshlang\'ich',
    image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'active',
    createdAt: '2024-01-15',
    lessons: 12,
    assignments: 5,
    tests: 3,
    resources: 8,
    videoLessons: 10,
    syncSessions: 4,
    asyncContent: 8,
    externalLinks: 3,
  },
  {
    id: 2,
    title: 'React Development',
    description: 'React kutubxonasi yordamida zamonaviy web ilovalar yarating',
    instructor: 'Malika Tosheva',
    students: 189,
    duration: '12 soat',
    rating: 4.9,
    progress: 60,
    scormCompliant: true,
    category: 'Dasturlash',
    level: 'O\'rta',
    image: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'active',
    createdAt: '2024-01-10',
    lessons: 15,
    assignments: 8,
    tests: 4,
    resources: 12,
    videoLessons: 13,
    syncSessions: 6,
    asyncContent: 9,
    externalLinks: 5,
  },
  {
    id: 3,
    title: 'Python Dasturlash',
    description: 'Python tilida dasturlashni o\'rganing va loyihalar yarating',
    instructor: 'Bobur Rahimov',
    students: 312,
    duration: '15 soat',
    rating: 4.7,
    progress: 90,
    scormCompliant: true,
    category: 'Dasturlash',
    level: 'Boshlang\'ich',
    image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'active',
    createdAt: '2024-01-05',
    lessons: 18,
    assignments: 10,
    tests: 5,
    resources: 15,
    videoLessons: 16,
    syncSessions: 8,
    asyncContent: 10,
    externalLinks: 7,
  },
  {
    id: 4,
    title: 'Data Science Kirish',
    description: 'Ma\'lumotlar tahlili va machine learning asoslari',
    instructor: 'Nodira Saidova',
    students: 156,
    duration: '20 soat',
    rating: 4.6,
    progress: 45,
    scormCompliant: true,
    category: 'Ma\'lumotlar',
    level: 'O\'rta',
    image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'draft',
    createdAt: '2023-12-20',
    lessons: 22,
    assignments: 12,
    tests: 6,
    resources: 18,
    videoLessons: 20,
    syncSessions: 10,
    asyncContent: 12,
    externalLinks: 9,
  },
];

const categories = [
  'Barcha kategoriyalar',
  'Dasturlash',
  'Ma\'lumotlar tahlili',
  'Web Development',
  'Mobile Development',
  'Dizayn',
  'Marketing',
];

const contentTypes = [
  { id: 'video', name: 'Video Darslar', icon: Video, count: 45 },
  { id: 'assignment', name: 'Topshiriqlar', icon: FileText, count: 28 },
  { id: 'test', name: 'Test Sinovlar', icon: CheckCircle, count: 15 },
  { id: 'resource', name: 'Resurslar', icon: BookOpen, count: 67 },
  { id: 'link', name: 'Tashqi Havolalar', icon: Link, count: 23 },
];

export function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barcha kategoriyalar');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState('courses');

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Barcha kategoriyalar' || course.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Loyiha</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Arxiv</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'active').length;
  const totalStudents = courses.reduce((sum, course) => sum + course.students, 0);
  const avgRating = courses.reduce((sum, course) => sum + course.rating, 0) / courses.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kurslar Boshqaruvi</h1>
          <p className="text-muted-foreground">
            O'quv kontentlari, videodarslar, testlar va topshiriqlarni boshqaring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yangi Kurs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yangi Kurs Yaratish</DialogTitle>
                <DialogDescription>
                  SCORM standartlariga mos yangi kurs yarating
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kurs nomi</Label>
                    <Input placeholder="Kurs nomini kiriting" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategoriya</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategoriyani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>O'qituvchi</Label>
                    <Input placeholder="O'qituvchi ismini kiriting" />
                  </div>
                  <div className="space-y-2">
                    <Label>Daraja</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Darajani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Boshlang'ich</SelectItem>
                        <SelectItem value="intermediate">O'rta</SelectItem>
                        <SelectItem value="advanced">Yuqori</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tavsif</Label>
                  <Textarea placeholder="Kurs haqida batafsil ma'lumot" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">SCORM uyg'unligi</Label>
                      <p className="text-sm text-muted-foreground">
                        SCORM 2004 standartlariga mos kurs yaratish
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Video darslar</Label>
                      <p className="text-sm text-muted-foreground">
                        Sinxron va asinxron video kontentlar
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Test sinovlari</Label>
                      <p className="text-sm text-muted-foreground">
                        Avtomatik baholash tizimi
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Kurs Yaratish</Button>
                  <Button variant="outline">Bekor qilish</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Jami Kurslar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{totalCourses}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {activeCourses} faol
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Jami Talabalar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{totalStudents.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Barcha kurslarda
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                O'rtacha Reyting
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                <Star className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{avgRating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              5 dan
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                SCORM Kurslar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 mb-1">{courses.filter(c => c.scormCompliant).length}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              100% uyg'unlik
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="sticky top-[-24px] z-30 bg-background/95 backdrop-blur-sm pb-4 pt-2 space-y-4 border-b border-border/40">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Kurslar</TabsTrigger>
            <TabsTrigger value="content">Kontent Boshqaruvi</TabsTrigger>
            <TabsTrigger value="assignments">Topshiriqlar</TabsTrigger>
            <TabsTrigger value="analytics">Tahlil</TabsTrigger>
          </TabsList>

          {selectedTab === "courses" && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Kurslarni qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="draft">Loyiha</SelectItem>
                  <SelectItem value="archived">Arxiv</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          )}
        </div>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6 pt-2">

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105 overflow-hidden">
                <div className="relative">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {course.scormCompliant && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
                        <Shield className="h-3 w-3" />
                        SCORM
                      </Badge>
                    )}
                    {getStatusBadge(course.status)}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">{course.level}</Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {course.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Video className="h-3 w-3 text-blue-600" />
                      <span>{course.videoLessons} video</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-green-600" />
                      <span>{course.assignments} topshiriq</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-purple-600" />
                      <span>{course.tests} test</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link className="h-3 w-3 text-orange-600" />
                      <span>{course.externalLinks} havola</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Yakunlanish</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" size="sm">
                      <Eye className="h-4 w-4" />
                      Ko'rish
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Tahrirlash
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

        {/* Content Management Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card key={type.id} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{type.count} ta element</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2" size="sm">
                        <Plus className="h-4 w-4" />
                        Qo'shish
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Yuklash
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Content Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Kontent Yuklash</CardTitle>
              <CardDescription>
                Video darslar, SCORM paketlar va boshqa o'quv materiallarini yuklang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Video Darslar</h3>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      MP4, AVI, MOV formatlarini qo'llab-quvvatlaydi
                    </p>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Video Yuklash
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">SCORM Paketlar</h3>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      SCORM 1.2 va 2004 standartlari
                    </p>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      SCORM Yuklash
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Topshiriqlar va Vazifalar</h2>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Topshiriq
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'JavaScript Loyiha', course: 'JavaScript Asoslari', deadline: '2024-01-20', submissions: 23, total: 25 },
              { title: 'React Component', course: 'React Development', deadline: '2024-01-25', submissions: 18, total: 20 },
              { title: 'Python Script', course: 'Python Dasturlash', deadline: '2024-01-30', submissions: 30, total: 32 },
            ].map((assignment, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription>{assignment.course}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Muddat: {assignment.deadline}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Topshirilgan</span>
                      <span>{assignment.submissions}/{assignment.total}</span>
                    </div>
                    <Progress value={(assignment.submissions / assignment.total) * 100} className="h-2" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ko'rish
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Eng Mashhur Kurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">JavaScript Asoslari</div>
                <div className="text-xs text-muted-foreground">245 talaba</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Yakunlanish Darajasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">78%</div>
                <div className="text-xs text-muted-foreground">O'rtacha ko'rsatkich</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Video Ko'rishlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">12,456</div>
                <div className="text-xs text-muted-foreground">Jami ko'rishlar</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tashqi Havolalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">156</div>
                <div className="text-xs text-muted-foreground">Faol havolalar</div>
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
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <img 
                        src={course.image} 
                        alt={course.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">{course.instructor}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-8 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{course.students}</div>
                        <div className="text-xs text-muted-foreground">Talabalar</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{course.progress}%</div>
                        <div className="text-xs text-muted-foreground">Yakunlangan</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{course.rating}</div>
                        <div className="text-xs text-muted-foreground">Reyting</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-600">{course.videoLessons}</div>
                        <div className="text-xs text-muted-foreground">Video</div>
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