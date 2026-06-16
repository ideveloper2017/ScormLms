import { useState, useMemo } from "react";
import {
  Bell, BookOpen, GraduationCap, ClipboardList, FileQuestion,
  AlertTriangle, Info, CheckCircle2, Star, Calendar,
  BellOff, Filter, UserCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from "@/hooks/notifications/useNotifications";
import { NotificationPageSkeleton } from "@/components/ui/skeletons/NotificationListSkeleton";
import type { Notification } from "@/types/notification.types";
import { formatRelativeTime } from "@/utils/time";

const TYPE_META: Record<Notification['type'], { label: string; icon: React.ElementType; color: string }> = {
  course:     { label: "Kurs",       icon: BookOpen,      color: "text-blue-500"   },
  assignment: { label: "Topshiriq",  icon: ClipboardList, color: "text-orange-500" },
  test:       { label: "Test",       icon: FileQuestion,  color: "text-teal-500"   },
  grade:      { label: "Baho",       icon: Star,          color: "text-yellow-500" },
  attendance: { label: "Davomat",    icon: UserCircle,    color: "text-green-500"  },
  system:     { label: "Tizim",      icon: Info,          color: "text-slate-500"  },
};

const PRIORITY_META: Record<Notification['priority'], { icon: React.ElementType; cls: string; dot: string }> = {
  low:     { icon: Info,          cls: "", dot: "bg-blue-400"   },
  normal:  { icon: Info,          cls: "", dot: "bg-blue-400"   },
  high:    { icon: AlertTriangle, cls: "border-l-yellow-400 bg-yellow-50/60 dark:bg-yellow-950/20", dot: "bg-yellow-400" },
  urgent:  { icon: AlertTriangle, cls: "border-l-red-400 bg-red-50/60 dark:bg-red-950/20", dot: "bg-red-400" },
};

const ALL_TYPES = ["all", ...Object.keys(TYPE_META)] as const;

export function StudentNotifications() {
  const [filter, setFilter] = useState<"all" | Notification['type']>("all");
  const [showRead, setShowRead] = useState(true);

  // Fetch notifications from API
  const { data: notifications = [], isLoading, error, refetch } = useNotifications();
  const { data: unreadCountData } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    const groups: Record<Notification['type'], Notification[]> = {
      course: [],
      assignment: [],
      test: [],
      grade: [],
      attendance: [],
      system: [],
    };

    notifications.forEach((notification) => {
      groups[notification.type].push(notification);
    });

    return groups;
  }, [notifications]);

  // Filter notifications
  const filtered = useMemo(() => {
    let result = notifications;

    // Filter by type
    if (filter !== "all") {
      result = result.filter((n) => n.type === filter);
    }

    // Filter by read status
    if (!showRead) {
      result = result.filter((n) => !n.isRead);
    }

    return result;
  }, [notifications, filter, showRead]);

  const unreadCount = unreadCountData?.count ?? 0;

  // Handlers
  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleMarkRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <NotificationPageSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Xatolik yuz berdi</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Ma'lumotlarni yuklashda xatolik"}
          </p>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
          >
            {isLoading ? "Yuklanmoqda..." : "Qayta urinish"}
          </Button>
        </div>
      </div>
    );
  }

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
            <Button 
              size="sm" 
              onClick={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Barchasini o'qildi
            </Button>
          )}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALL_TYPES.map((type) => {
          const isAll = type === "all";
          const meta = isAll ? null : TYPE_META[type];
          const Icon = meta?.icon;
          
          // Calculate count for each type
          const typeCount = isAll 
            ? notifications.length 
            : groupedNotifications[type]?.length ?? 0;

          return (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              className="gap-1.5 shrink-0 text-xs"
              onClick={() => setFilter(type)}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {isAll ? "Barchasi" : meta?.label}
              {typeCount > 0 && (
                <Badge 
                  variant={filter === type ? "secondary" : "outline"} 
                  className="ml-1 h-4 min-w-4 px-1 text-xs"
                >
                  {typeCount}
                </Badge>
              )}
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
                !notif.isRead && "shadow-sm border-primary/20",
                priorityMeta.cls && `border-l-4 ${priorityMeta.cls}`,
              )}
              onClick={() => handleMarkRead(notif.id)}
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
                      <span className={cn(
                        "font-medium text-sm", 
                        !notif.isRead && "font-bold text-foreground"
                      )}>
                        {notif.title}
                      </span>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm text-muted-foreground mt-1 leading-relaxed",
                    !notif.isRead && "text-foreground/80"
                  )}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{typeMeta.label}</Badge>
                    {notif.priority === "high" && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">Muhim</Badge>
                    )}
                    {notif.priority === "urgent" && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">Shoshilinch</Badge>
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
