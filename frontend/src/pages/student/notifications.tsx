import { useState } from "react";
import {
  Bell, BookOpen, GraduationCap, ClipboardList, FileQuestion,
  AlertTriangle, Info, CheckCircle2, Star, Calendar,
  BellOff, Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "course" | "exam" | "assignment" | "test" | "grade" | "system" | "calendar";
  priority: "info" | "warning" | "success";
  read: boolean;
}

const NOTIFICATIONS: Notification[] = [
  { id: 1,  title: "Yangi topshiriq qo'shildi", message: "Dasturlash asoslari kursida 'JavaScript loyiha' topshirig'i qo'shildi. Topshirish muddati: 20 iyun.", time: "10 daqiqa oldin", type: "assignment", priority: "info",    read: false },
  { id: 2,  title: "Imtihon eslatmasi", message: "JavaScript Yakuniy imtihoni 22 iyun kuni soat 14:00 da bo'ladi. Tayyorgarlik ko'ring!", time: "1 soat oldin", type: "exam", priority: "warning", read: false },
  { id: 3,  title: "Baho qo'yildi", message: "Algoritmlar nazariyasi kursidagi 'Kurs ishi'ga 47/50 ball qo'yildi. A+ baho.", time: "3 soat oldin", type: "grade", priority: "success", read: false },
  { id: 4,  title: "Test natijalari", message: "HTML/CSS Tezkor testida 80% natija ko'rsatdingiz. Natijalarni ko'rish mumkin.", time: "Kecha 18:30", type: "test", priority: "info", read: true },
  { id: 5,  title: "Yangi kurs materiallar", message: "React Development kursiga yangi video darslar qo'shildi: 'Hooks va Context API'.", time: "Kecha 14:00", type: "course", priority: "info", read: true },
  { id: 6,  title: "Davomat ogohlantirishi", message: "Web dasturlash kursida davomatingiz 75% dan past tushdi. Darslarni o'tkazib yubormang!", time: "2 kun oldin", type: "system", priority: "warning", read: true },
  { id: 7,  title: "Akademik kalendar yangilandi", message: "Bahorgi imtihon sessiyasi sanalari o'zgartirildi. Yangi sana: 16-30 iyun.", time: "3 kun oldin", type: "calendar", priority: "info", read: true },
  { id: 8,  title: "Topshiriq muddati yaqinlashdi", message: "SQL so'rovlar to'plami topshirig'ini topshirishga 2 kun qoldi!", time: "3 kun oldin", type: "assignment", priority: "warning", read: true },
  { id: 9,  title: "Kurs yakunlandi", message: "HTML/CSS Asoslari kursini muvaffaqiyatli tamomlangiz! Sertifikat olishingiz mumkin.", time: "1 hafta oldin", type: "course", priority: "success", read: true },
  { id: 10, title: "Tizim yangilanishi", message: "Tizim 15 iyun kuni kechqurun 23:00–00:00 oralig'ida texnik ishlar olib boriladi.", time: "1 hafta oldin", type: "system", priority: "info", read: true },
];

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  course:     { label: "Kurs",       icon: BookOpen,    color: "text-blue-500"   },
  exam:       { label: "Imtihon",    icon: GraduationCap, color: "text-purple-500" },
  assignment: { label: "Topshiriq",  icon: ClipboardList, color: "text-orange-500" },
  test:       { label: "Test",       icon: FileQuestion,  color: "text-teal-500"   },
  grade:      { label: "Baho",       icon: Star,          color: "text-yellow-500" },
  system:     { label: "Tizim",      icon: Info,          color: "text-slate-500"  },
  calendar:   { label: "Kalendar",   icon: Calendar,      color: "text-indigo-500" },
};

const PRIORITY_META: Record<string, { icon: React.ElementType; cls: string; dot: string }> = {
  info:    { icon: Info,         cls: "", dot: "bg-blue-400"   },
  warning: { icon: AlertTriangle, cls: "border-l-yellow-400 bg-yellow-50/60 dark:bg-yellow-950/20", dot: "bg-yellow-400" },
  success: { icon: CheckCircle2, cls: "border-l-green-400  bg-green-50/60  dark:bg-green-950/20",  dot: "bg-green-400"  },
};

const ALL_TYPES = ["all", ...Object.keys(TYPE_META)];

export function StudentNotifications() {
  const [filter, setFilter] = useState("all");
  const [showRead, setShowRead] = useState(true);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  const markRead = (id: number) => setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));

  const filtered = notifications.filter((n) => {
    const matchType = filter === "all" || n.type === filter;
    const matchRead = showRead || !n.read;
    return matchType && matchRead;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bildirishnomalar</h1>
            <p className="text-muted-foreground">Barcha xabarnomalar va eslatmalar</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white text-sm">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowRead((v) => !v)}
          >
            <BellOff className="h-4 w-4" />
            {showRead ? "Faqat o'qilmagan" : "Barchasini ko'rish"}
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllRead} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />Barchasini o'qildi
            </Button>
          )}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALL_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta?.icon;
          return (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              className="gap-1.5 shrink-0 text-xs"
              onClick={() => setFilter(type)}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {type === "all" ? "Barchasi" : meta.label}
            </Button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Bildirishnoma topilmadi</p>
          </div>
        )}
        {filtered.map((notif) => {
          const typeMeta = TYPE_META[notif.type];
          const priorityMeta = PRIORITY_META[notif.priority];
          const TypeIcon = typeMeta.icon;

          return (
            <Card
              key={notif.id}
              className={cn(
                "cursor-pointer transition-all",
                !notif.read && "shadow-sm border-primary/20",
                priorityMeta.cls && `border-l-4 ${priorityMeta.cls}`,
              )}
              onClick={() => markRead(notif.id)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={cn(
                  "p-2 rounded-lg shrink-0 mt-0.5",
                  "bg-muted",
                )}>
                  <TypeIcon className={`h-4 w-4 ${typeMeta.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium text-sm", !notif.read && "text-foreground")}>{notif.title}</span>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{typeMeta.label}</Badge>
                    {notif.priority === "warning" && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">Muhim</Badge>
                    )}
                    {notif.priority === "success" && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">Bajarildi</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
