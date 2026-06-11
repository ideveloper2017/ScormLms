import { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Download,
  Eye,
  Star,
  Calendar,
  User,
  FileText,
  GraduationCap,
  Microscope,
  Library,
  Tag,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
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

const resources = [
  {
    id: 1,
    title: 'JavaScript: The Definitive Guide',
    type: 'darslik',
    author: 'David Flanagan',
    category: 'Dasturlash',
    description: 'JavaScript tilining to\'liq qo\'llanmasi va amaliy misollar',
    publishDate: '2023-05-15',
    pages: 1096,
    language: 'Ingliz tili',
    rating: 4.8,
    downloads: 1250,
    fileSize: '15.2 MB',
    format: 'PDF',
    tags: ['JavaScript', 'Web Development', 'Programming'],
    image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 2,
    title: 'Machine Learning asoslari',
    type: 'monografiya',
    author: 'Prof. Alisher Karimov',
    category: 'Sun\'iy intellekt',
    description: 'Machine learning algoritmlarining nazariy asoslari va amaliy tatbiqi',
    publishDate: '2023-08-20',
    pages: 456,
    language: 'O\'zbek tili',
    rating: 4.9,
    downloads: 890,
    fileSize: '8.7 MB',
    format: 'PDF',
    tags: ['Machine Learning', 'AI', 'Data Science'],
    image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 3,
    title: 'Blockchain texnologiyalarining ta\'lim sohasida qo\'llanilishi',
    type: 'ilmiy_maqola',
    author: 'Dr. Malika Tosheva',
    category: 'Blockchain',
    description: 'Blockchain texnologiyalarining zamonaviy ta\'lim tizimidagi imkoniyatlari',
    publishDate: '2023-11-10',
    pages: 24,
    language: 'O\'zbek tili',
    rating: 4.6,
    downloads: 567,
    fileSize: '2.1 MB',
    format: 'PDF',
    tags: ['Blockchain', 'Education', 'Technology'],
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 4,
    title: 'Python dasturlash tili: Amaliy loyihalar',
    type: 'tadqiqot',
    author: 'Bobur Rahimov',
    category: 'Dasturlash',
    description: 'Python tilida real loyihalar yaratish bo\'yicha tadqiqot natijalari',
    publishDate: '2023-09-05',
    pages: 312,
    language: 'O\'zbek tili',
    rating: 4.7,
    downloads: 1100,
    fileSize: '12.5 MB',
    format: 'PDF',
    tags: ['Python', 'Projects', 'Research'],
    image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
];

const categories = [
  'Barcha kategoriyalar',
  'Dasturlash',
  'Sun\'iy intellekt',
  'Blockchain',
  'Ma\'lumotlar tahlili',
  'Web Development',
  'Mobile Development',
];

const resourceTypes = [
  'Barchasi',
  'darslik',
  'monografiya',
  'ilmiy_maqola',
  'tadqiqot',
];

export function Resources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barcha kategoriyalar');
  const [selectedType, setSelectedType] = useState('Barchasi');
  const [sortBy, setSortBy] = useState('newest');

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Barcha kategoriyalar' || resource.category === selectedCategory;
    const matchesType = selectedType === 'Barchasi' || resource.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'darslik':
        return <BookOpen className="h-4 w-4" />;
      case 'monografiya':
        return <Library className="h-4 w-4" />;
      case 'ilmiy_maqola':
        return <FileText className="h-4 w-4" />;
      case 'tadqiqot':
        return <Microscope className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      darslik: 'bg-blue-100 text-blue-800',
      monografiya: 'bg-green-100 text-green-800',
      ilmiy_maqola: 'bg-purple-100 text-purple-800',
      tadqiqot: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      darslik: 'Darslik',
      monografiya: 'Monografiya',
      ilmiy_maqola: 'Ilmiy maqola',
      tadqiqot: 'Tadqiqot',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Axborot Resurslari</h1>
          <p className="text-muted-foreground">
            O'quv adabiyotlari, darsliklar, monografiyalar va ilmiy tadqiqotlar
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Resurs
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yangi Resurs Qo'shish</DialogTitle>
              <DialogDescription>
                Yangi o'quv resursi yoki ilmiy materialini qo'shing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sarlavha</Label>
                  <Input placeholder="Resurs sarlavhasini kiriting" />
                </div>
                <div className="space-y-2">
                  <Label>Muallif</Label>
                  <Input placeholder="Muallif ismini kiriting" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turi</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Resurs turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="darslik">Darslik</SelectItem>
                      <SelectItem value="monografiya">Monografiya</SelectItem>
                      <SelectItem value="ilmiy_maqola">Ilmiy maqola</SelectItem>
                      <SelectItem value="tadqiqot">Tadqiqot</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Textarea placeholder="Resurs haqida qisqacha ma'lumot" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sahifalar soni</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Til</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tilni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uzbek">O'zbek tili</SelectItem>
                      <SelectItem value="english">Ingliz tili</SelectItem>
                      <SelectItem value="russian">Rus tili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Formatni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">DOC</SelectItem>
                      <SelectItem value="epub">EPUB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Resurs Qo'shish</Button>
                <Button variant="outline">Bekor qilish</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 border-slate-200 dark:border-slate-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Jami Resurslar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600 mb-1">1,247</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +23 yangi
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Darsliklar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                <Library className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">456</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Library className="h-3 w-3 text-blue-500" />
              36% umumiy
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ilmiy Maqolalar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">389</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3 text-purple-500" />
              31% umumiy
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Microscope className="h-4 w-4" />
                Tadqiqotlar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
                <Microscope className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 mb-1">234</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Microscope className="h-3 w-3 text-orange-500" />
              19% umumiy
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Resurslarni qidiring..."
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
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'Barchasi' ? type : getTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Eng yangi</SelectItem>
            <SelectItem value="oldest">Eng eski</SelectItem>
            <SelectItem value="popular">Mashhur</SelectItem>
            <SelectItem value="rating">Yuqori baho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105 overflow-hidden">
            <div className="relative">
              <img 
                src={resource.image} 
                alt={resource.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge className={getTypeBadge(resource.type)}>
                  <div className="flex items-center gap-1">
                    {getTypeIcon(resource.type)}
                    {getTypeLabel(resource.type)}
                  </div>
                </Badge>
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {resource.rating}
                </Badge>
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {resource.description}
              </CardDescription>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{resource.author}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {resource.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {resource.publishDate}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {resource.pages} sahifa
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {resource.downloads} yuklab olish
                </div>
                <div className="flex items-center gap-1">
                  <span>{resource.fileSize} • {resource.format}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" size="sm">
                  <Eye className="h-4 w-4" />
                  Ko'rish
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Yuklab olish
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Resurslar topilmadi</h3>
          <p className="text-muted-foreground mb-4">
            Qidiruv shartlaringizga mos resurslar mavjud emas
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('Barcha kategoriyalar');
            setSelectedType('Barchasi');
          }}>
            Filterni tozalash
          </Button>
        </div>
      )}
    </div>
  );
}