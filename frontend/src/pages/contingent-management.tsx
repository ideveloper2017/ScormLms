import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  Eye,
  Trash2,
  Settings,
  Download,
  Upload,
  UserCheck,
  UserX,
  Award,
  Clock,
  Building,
  FileText,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
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
    studentId: 'STU001',
    name: 'Alisher Karimov',
    email: 'alisher@student.uz',
    phone: '+998901234567',
    birthDate: '1998-05-15',
    address: 'Toshkent sh., Yunusobod t.',
    group: 'JS-2024-01',
    course: 'JavaScript Asoslari',
    enrollmentDate: '2024-01-15',
    status: 'active',
    gpa: 4.2,
    completedCourses: 3,
    totalCourses: 5,
    attendance: 92,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
    personalCabinet: {
      lastLogin: '2024-01-15 14:30',
      profileCompletion: 85,
      achievements: ['JavaScript Master', 'Perfect Attendance'],
      currentProjects: 2,
    }
  },
  {
    id: 2,
    studentId: 'STU002',
    name: 'Malika Tosheva',
    email: 'malika@student.uz',
    phone: '+998901234568',
    birthDate: '1999-08-22',
    address: 'Samarqand sh., Registon t.',
    group: 'PY-2024-02',
    course: 'Python Dasturlash',
    enrollmentDate: '2024-01-10',
    status: 'active',
    gpa: 4.8,
    completedCourses: 4,
    totalCourses: 4,
    attendance: 98,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    personalCabinet: {
      lastLogin: '2024-01-15 10:15',
      profileCompletion: 95,
      achievements: ['Python Expert', 'Top Student', 'Research Leader'],
      currentProjects: 3,
    }
  },
  {
    id: 3,
    studentId: 'STU003',
    name: 'Bobur Rahimov',
    email: 'bobur@student.uz',
    phone: '+998901234569',
    birthDate: '2000-03-10',
    address: 'Buxoro sh., Markaziy t.',
    group: 'WD-2024-03',
    course: 'Web Development',
    enrollmentDate: '2024-01-05',
    status: 'inactive',
    gpa: 3.5,
    completedCourses: 1,
    totalCourses: 3,
    attendance: 78,
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
    personalCabinet: {
      lastLogin: '2024-01-12 16:45',
      profileCompletion: 60,
      achievements: ['First Course Complete'],
      currentProjects: 1,
    }
  },
];

const teachers = [
  {
    id: 1,
    teacherId: 'TCH001',
    name: 'Dr. Aziz Karimov',
    email: 'aziz@teacher.uz',
    phone: '+998901111111',
    birthDate: '1985-12-05',
    address: 'Toshkent sh., Mirzo Ulug\'bek t.',
    department: 'Dasturlash',
    position: 'Katta o\'qituvchi',
    experience: 8,
    education: 'PhD Computer Science',
    hireDate: '2020-09-01',
    status: 'active',
    courses: ['JavaScript Asoslari', 'React Development'],
    students: 156,
    rating: 4.8,
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100',
    personalCabinet: {
      lastLogin: '2024-01-15 09:00',
      profileCompletion: 100,
      publications: 12,
      activeCourses: 2,
    }
  },
  {
    id: 2,
    teacherId: 'TCH002',
    name: 'Prof. Nigora Saidova',
    email: 'nigora@teacher.uz',
    phone: '+998901111112',
    birthDate: '1980-07-18',
    address: 'Toshkent sh., Chilonzor t.',
    department: 'Ma\'lumotlar tahlili',
    position: 'Professor',
    experience: 15,
    education: 'PhD Data Science',
    hireDate: '2018-03-15',
    status: 'active',
    courses: ['Python Dasturlash', 'Machine Learning', 'Data Science'],
    students: 234,
    rating: 4.9,
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100',
    personalCabinet: {
      lastLogin: '2024-01-15 08:30',
      profileCompletion: 100,
      publications: 28,
      activeCourses: 3,
    }
  },
];

const groups = [
  {
    id: 1,
    groupId: 'JS-2024-01',
    name: 'JavaScript Asoslari - 2024',
    course: 'JavaScript Asoslari',
    teacher: 'Dr. Aziz Karimov',
    students: 25,
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    status: 'active',
    schedule: 'Dush, Chor, Juma - 14:00-16:00',
  },
  {
    id: 2,
    groupId: 'PY-2024-02',
    name: 'Python Dasturlash - 2024',
    course: 'Python Dasturlash',
    teacher: 'Prof. Nigora Saidova',
    students: 30,
    startDate: '2024-01-10',
    endDate: '2024-07-10',
    status: 'active',
    schedule: 'Sesh, Payshanba, Shanba - 10:00-12:00',
  },
];

export function ContingentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState('students');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || teacher.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Faol</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Nofaol</Badge>;
      case 'graduated':
        return <Badge className="bg-blue-100 text-blue-800">Bitirgan</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">To\'xtatilgan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 4.5) return 'text-green-600';
    if (gpa >= 4.0) return 'text-blue-600';
    if (gpa >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === 'active').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontingent Boshqaruvi</h1>
          <p className="text-muted-foreground">
            Talabalar va pedagog kadrlarning yagona reyestri va shaxsiy kabinetlar
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
                Yangi Qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yangi Shaxs Qo'shish</DialogTitle>
                <DialogDescription>
                  Yangi talaba yoki o'qituvchi ma'lumotlarini kiriting
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Turi</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Turni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Talaba</SelectItem>
                        <SelectItem value="teacher">O'qituvchi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ID raqam</Label>
                    <Input placeholder="STU001 yoki TCH001" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>To'liq ism</Label>
                    <Input placeholder="Ism familiyani kiriting" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input placeholder="+998901234567" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tug'ilgan sana</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Manzil</Label>
                  <Textarea placeholder="To'liq manzilni kiriting" />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Saqlash</Button>
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
              <GraduationCap className="h-4 w-4" />
              Jami Talabalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <div className="text-xs text-muted-foreground">{activeStudents} faol</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Pedagog Kadrlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <div className="text-xs text-muted-foreground">{activeTeachers} faol</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guruhlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <div className="text-xs text-muted-foreground">Faol guruhlar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              O'rtacha GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.17</div>
            <div className="text-xs text-muted-foreground">Yaxshi natija</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students">Talabalar</TabsTrigger>
          <TabsTrigger value="teachers">O'qituvchilar</TabsTrigger>
          <TabsTrigger value="groups">Guruhlar</TabsTrigger>
          <TabsTrigger value="cabinet">Shaxsiy Kabinet</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Talabalarni qidiring (ism, ID, email)..."
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
                <SelectItem value="inactive">Nofaol</SelectItem>
                <SelectItem value="graduated">Bitirgan</SelectItem>
                <SelectItem value="suspended">To'xtatilgan</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Qo'shimcha Filter
            </Button>
          </div>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Talabalar Reyestri</CardTitle>
              <CardDescription>Barcha talabalar va ularning ma'lumotlari</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talaba</TableHead>
                    <TableHead>ID / Guruh</TableHead>
                    <TableHead>Aloqa</TableHead>
                    <TableHead>Kurs</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Jarayon</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar} alt={student.name} />
                            <AvatarFallback>
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Ro'yxat: {student.enrollmentDate}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.studentId}</div>
                          <div className="text-sm text-muted-foreground">{student.group}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{student.course}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getGPAColor(student.gpa)}`}>
                          {student.gpa}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{student.completedCourses}/{student.totalCourses}</span>
                            <span>{Math.round((student.completedCourses / student.totalCourses) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(student.completedCourses / student.totalCourses) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedPerson(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
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

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="O'qituvchilarni qidiring (ism, ID, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Bo'lim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha bo'limlar</SelectItem>
                <SelectItem value="programming">Dasturlash</SelectItem>
                <SelectItem value="data">Ma'lumotlar tahlili</SelectItem>
                <SelectItem value="design">Dizayn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teachers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pedagog Kadrlar Reyestri</CardTitle>
              <CardDescription>Barcha o'qituvchilar va ularning ma'lumotlari</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>O'qituvchi</TableHead>
                    <TableHead>ID / Bo'lim</TableHead>
                    <TableHead>Lavozim</TableHead>
                    <TableHead>Tajriba</TableHead>
                    <TableHead>Kurslar</TableHead>
                    <TableHead>Reyting</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>
                              {teacher.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-muted-foreground">{teacher.education}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{teacher.teacherId}</div>
                          <div className="text-sm text-muted-foreground">{teacher.department}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{teacher.position}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{teacher.experience} yil</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{teacher.courses.length} ta kurs</div>
                          <div className="text-sm text-muted-foreground">{teacher.students} talaba</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{teacher.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(teacher.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedPerson(teacher)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
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

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{group.name}</span>
                    {getStatusBadge(group.status)}
                  </CardTitle>
                  <CardDescription>{group.course}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{group.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{group.students} talaba</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{group.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>6 oy</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Dars jadvali:</div>
                    <div className="text-sm text-muted-foreground">{group.schedule}</div>
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

        {/* Personal Cabinet Tab */}
        <TabsContent value="cabinet" className="space-y-6">
          {selectedPerson ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedPerson.avatar} alt={selectedPerson.name} />
                      <AvatarFallback>
                        {selectedPerson.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{selectedPerson.name}</h2>
                      <p className="text-muted-foreground">
                        {selectedPerson.studentId || selectedPerson.teacherId}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Shaxsiy Ma'lumotlar</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPerson.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPerson.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPerson.birthDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPerson.address}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">
                        {selectedPerson.studentId ? 'O\'quv Ma\'lumotlari' : 'Ish Ma\'lumotlari'}
                      </h3>
                      <div className="space-y-2 text-sm">
                        {selectedPerson.studentId ? (
                          <>
                            <div className="flex justify-between">
                              <span>Guruh:</span>
                              <span className="font-medium">{selectedPerson.group}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>GPA:</span>
                              <span className={`font-medium ${getGPAColor(selectedPerson.gpa)}`}>
                                {selectedPerson.gpa}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Davomat:</span>
                              <span className="font-medium">{selectedPerson.attendance}%</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>Bo'lim:</span>
                              <span className="font-medium">{selectedPerson.department}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Lavozim:</span>
                              <span className="font-medium">{selectedPerson.position}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tajriba:</span>
                              <span className="font-medium">{selectedPerson.experience} yil</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity & Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Faollik</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Profil to'ldirilishi</div>
                    <Progress value={selectedPerson.personalCabinet.profileCompletion} className="h-2" />
                    <div className="text-right text-sm font-medium">
                      {selectedPerson.personalCabinet.profileCompletion}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Oxirgi kirish</div>
                    <div className="text-sm font-medium">
                      {selectedPerson.personalCabinet.lastLogin}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Yutuqlar</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedPerson.personalCabinet.achievements.map((achievement: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs gap-1">
                          <Award className="h-3 w-3" />
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {selectedPerson.studentId && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Joriy loyihalar</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedPerson.personalCabinet.currentProjects}
                      </div>
                    </div>
                  )}
                  
                  {selectedPerson.teacherId && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Nashrlar</div>
                      <div className="text-lg font-bold text-green-600">
                        {selectedPerson.personalCabinet.publications}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Shaxsiy Kabinet</h3>
              <p className="text-muted-foreground mb-4">
                Batafsil ma'lumot ko'rish uchun talaba yoki o'qituvchini tanlang
              </p>
              <Button onClick={() => setSelectedTab('students')}>
                Talabalarni Ko'rish
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}