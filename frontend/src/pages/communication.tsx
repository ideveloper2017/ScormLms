import { useState } from 'react';
import { 
  MessageCircle, 
  Users, 
  Mail, 
  Video, 
  Send, 
  Plus,
  Search,
  Filter,
  Phone,
  Calendar,
  Paperclip,
  Smile,
  MoreVertical,
  Star,
  Reply,
  Forward,
  Archive,
  Trash2,
  Settings,
  Bell,
  UserPlus,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Volume2,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';

const forumTopics = [
  {
    id: 1,
    title: 'JavaScript Asoslari - Savollar va Javoblar',
    category: 'Dasturlash',
    author: 'Alisher Karimov',
    replies: 23,
    views: 156,
    lastActivity: '2 soat oldin',
    isPinned: true,
    tags: ['JavaScript', 'Boshlang\'ich'],
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 2,
    title: 'React Hooks - Amaliy Misollar',
    category: 'Web Development',
    author: 'Malika Tosheva',
    replies: 45,
    views: 289,
    lastActivity: '4 soat oldin',
    isPinned: false,
    tags: ['React', 'Hooks', 'O\'rta'],
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 3,
    title: 'Python Machine Learning - Loyiha G\'oyalari',
    category: 'Data Science',
    author: 'Bobur Rahimov',
    replies: 18,
    views: 134,
    lastActivity: '1 kun oldin',
    isPinned: false,
    tags: ['Python', 'ML', 'Loyiha'],
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
];

const chatRooms = [
  {
    id: 1,
    name: 'JavaScript Guruhi',
    type: 'course',
    participants: 45,
    lastMessage: 'Yangi dars haqida savol bor...',
    lastTime: '10:30',
    unread: 3,
    avatar: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 2,
    name: 'O\'qituvchilar',
    type: 'staff',
    participants: 12,
    lastMessage: 'Imtihon jadvali muhokamasi',
    lastTime: '09:15',
    unread: 0,
    avatar: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 3,
    name: 'Umumiy Chat',
    type: 'general',
    participants: 234,
    lastMessage: 'Salom hammaga!',
    lastTime: 'Kecha',
    unread: 12,
    avatar: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
];

const messages = [
  {
    id: 1,
    from: 'Alisher Karimov',
    to: 'Men',
    subject: 'Kurs materiallari haqida',
    preview: 'Yangi JavaScript kursi uchun qo\'shimcha materiallar...',
    time: '14:30',
    isRead: false,
    isStarred: true,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 2,
    from: 'Tizim',
    to: 'Men',
    subject: 'Imtihon natijalari tayyor',
    preview: 'React Development kursi imtihon natijalari...',
    time: '12:15',
    isRead: true,
    isStarred: false,
    avatar: null,
  },
  {
    id: 3,
    from: 'Malika Tosheva',
    to: 'Men',
    subject: 'Videokonferensiya taklifi',
    time: '10:45',
    preview: 'Ertaga soat 15:00 da Python bo\'yicha...',
    isRead: true,
    isStarred: false,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
];

const videoConferences = [
  {
    id: 1,
    title: 'JavaScript Asoslari - Dars 5',
    instructor: 'Alisher Karimov',
    date: '2024-01-16',
    time: '14:00',
    duration: '90 daqiqa',
    participants: 23,
    status: 'scheduled',
    meetingId: 'js-lesson-5-2024',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 2,
    title: 'React Hooks - Amaliy Mashg\'ulot',
    instructor: 'Malika Tosheva',
    date: '2024-01-16',
    time: '16:30',
    duration: '60 daqiqa',
    participants: 18,
    status: 'live',
    meetingId: 'react-hooks-practice',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  {
    id: 3,
    title: 'Python ML - Loyiha Muhokamasi',
    instructor: 'Bobur Rahimov',
    date: '2024-01-17',
    time: '10:00',
    duration: '120 daqiqa',
    participants: 15,
    status: 'scheduled',
    meetingId: 'python-ml-project',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
];

export function Communication() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState('forum');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-100 text-red-800 animate-pulse">Jonli</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Rejalashtirilgan</Badge>;
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800">Tugagan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getChatTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '📚';
      case 'staff':
        return '👨‍🏫';
      case 'general':
        return '💬';
      default:
        return '💬';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* API not connected banner */}
      <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Kommunikatsiya xizmati hali real API ga ulanmagan. Ko'rsatilgan ma'lumotlar namunavirus.
          </p>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kommunikatsiya</h1>
          <p className="text-muted-foreground">
            Forum, chat, xabarlar va videokonferensiya tizimi
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Video className="h-4 w-4" />
                Konferensiya
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi Videokonferensiya</DialogTitle>
                <DialogDescription>
                  Yangi video uchrashuvini rejalashtiring
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mavzu</label>
                  <Input placeholder="Konferensiya mavzusini kiriting" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sana</label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vaqt</label>
                    <Input type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Davomiyligi (daqiqa)</label>
                  <Input type="number" placeholder="60" />
                </div>
                <Button className="w-full">Konferensiya Yaratish</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi Xabar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Forum Mavzulari
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-md">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600 mb-1">127</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +8 yangi
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Faol Chat Xonalari
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600 mb-1">23</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-500" />
              456 ishtirokchi
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-violet-200 dark:border-violet-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Bugungi Konferensiyalar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-md">
                <Video className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600 mb-1">5</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Video className="h-3 w-3 text-red-500" />
              2 ta jonli
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              O'qilmagan Xabarlar
              </span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md">
                <Mail className="h-4 w-4 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600 mb-1">12</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              3 ta muhim
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forum">Forum</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="messages">Xabarlar</TabsTrigger>
          <TabsTrigger value="video">Videokonferensiya</TabsTrigger>
        </TabsList>

        {/* Forum Tab */}
        <TabsContent value="forum" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Forum mavzularini qidiring..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                <SelectItem value="programming">Dasturlash</SelectItem>
                <SelectItem value="web">Web Development</SelectItem>
                <SelectItem value="data">Data Science</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Mavzu
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forum Mavzulari</CardTitle>
              <CardDescription>Talabalar va o'qituvchilar muhokamasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forumTopics.map((topic) => (
                  <div key={topic.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={topic.avatar} alt={topic.author} />
                      <AvatarFallback>
                        {topic.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {topic.isPinned && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            <h3 className="font-medium hover:text-primary cursor-pointer">
                              {topic.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {topic.author} • {topic.category}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {topic.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{topic.replies} javob</span>
                        <span>{topic.views} ko'rish</span>
                        <span>Oxirgi: {topic.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Chat Rooms List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Chat Xonalari</span>
                  <Button size="icon" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 p-4">
                    {chatRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChat === room.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedChat(room.id)}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.avatar} alt={room.name} />
                            <AvatarFallback>{getChatTypeIcon(room.type)}</AvatarFallback>
                          </Avatar>
                          {room.unread > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                              {room.unread}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{room.name}</h4>
                            <span className="text-xs text-muted-foreground">{room.lastTime}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{room.lastMessage}</p>
                          <p className="text-xs text-muted-foreground">{room.participants} ishtirokchi</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedChat ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={chatRooms.find(r => r.id === selectedChat)?.avatar} />
                        <AvatarFallback>
                          {getChatTypeIcon(chatRooms.find(r => r.id === selectedChat)?.type || 'general')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{chatRooms.find(r => r.id === selectedChat)?.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {chatRooms.find(r => r.id === selectedChat)?.participants} ishtirokchi
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span>Chat tanlang</span>
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[450px]">
                {selectedChat ? (
                  <>
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-4 p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100" />
                            <AvatarFallback>AK</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Alisher Karimov</span>
                              <span className="text-xs text-muted-foreground">10:30</span>
                            </div>
                            <p className="text-sm mt-1">Salom hammaga! Bugungi dars haqida savol bor.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100" />
                            <AvatarFallback>MT</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Malika Tosheva</span>
                              <span className="text-xs text-muted-foreground">10:32</span>
                            </div>
                            <p className="text-sm mt-1">Salom! Qanday savol bor?</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 flex-row-reverse">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>Men</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-xs text-muted-foreground">10:35</span>
                              <span className="font-medium text-sm">Men</span>
                            </div>
                            <div className="bg-primary text-primary-foreground rounded-lg p-3 mt-1 inline-block">
                              <p className="text-sm">Array metodlari haqida batafsil tushuntira olasizmi?</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                    
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Xabar yozing..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="icon" variant="ghost">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                      <p>Chat xonasini tanlang</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Xabarlarni qidiring..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha xabarlar</SelectItem>
                <SelectItem value="unread">O'qilmagan</SelectItem>
                <SelectItem value="starred">Yulduzli</SelectItem>
                <SelectItem value="important">Muhim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Xabarlar</CardTitle>
              <CardDescription>Shaxsiy xabarlar va tizim bildirishnomalari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      !message.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {message.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      <Avatar className="h-10 w-10">
                        {message.avatar ? (
                          <AvatarImage src={message.avatar} alt={message.from} />
                        ) : null}
                        <AvatarFallback>
                          {message.from === 'Tizim' ? '🔔' : message.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${!message.isRead ? 'text-primary' : ''}`}>
                          {message.from}
                        </span>
                        <span className="text-sm text-muted-foreground">{message.time}</span>
                      </div>
                      <h4 className={`text-sm truncate ${!message.isRead ? 'font-medium' : ''}`}>
                        {message.subject}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">{message.preview}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost">
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Conference Tab */}
        <TabsContent value="video" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Konferensiyalarni qidiring..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="live">Jonli</SelectItem>
                <SelectItem value="scheduled">Rejalashtirilgan</SelectItem>
                <SelectItem value="ended">Tugagan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoConferences.map((conference) => (
              <Card key={conference.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conference.avatar} alt={conference.instructor} />
                        <AvatarFallback>
                          {conference.instructor.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{conference.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{conference.instructor}</p>
                      </div>
                    </div>
                    {getStatusBadge(conference.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{conference.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{conference.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{conference.participants} kishi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span>{conference.duration}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    {conference.status === 'live' ? (
                      <Button className="flex-1 gap-2 bg-red-600 hover:bg-red-700">
                        <Video className="h-4 w-4" />
                        Qo'shilish
                      </Button>
                    ) : conference.status === 'scheduled' ? (
                      <Button className="flex-1 gap-2" variant="outline">
                        <Calendar className="h-4 w-4" />
                        Eslatma
                      </Button>
                    ) : (
                      <Button className="flex-1 gap-2" variant="outline">
                        <Video className="h-4 w-4" />
                        Yozuv
                      </Button>
                    )}
                    <Button size="icon" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live Conference Interface */}
          {videoConferences.some(c => c.status === 'live') && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-400">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  Jonli Konferensiya
                </CardTitle>
                <CardDescription>React Hooks - Amaliy Mashg'ulot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-3">
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <Video className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg font-medium">Video oqimi</p>
                        <p className="text-sm opacity-70">18 ishtirokchi</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="gap-2">
                        <Mic className="h-4 w-4" />
                        Mikrofon
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <VideoOff className="h-4 w-4" />
                        Kamera
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <ScreenShare className="h-4 w-4" />
                        Ekran
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-2">
                        <Phone className="h-4 w-4" />
                        Chiqish
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Ishtirokchilar</h4>
                      <ScrollArea className="h-32">
                        <div className="space-y-1">
                          {['Malika Tosheva', 'Alisher Karimov', 'Bobur Rahimov', 'Nodira Saidova'].map((name, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span>{name}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}