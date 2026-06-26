import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, BellOff, ArrowRight, BookOpen, ClipboardList,
  FileQuestion, Star, Info, UserCircle, CheckCircle2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useUnreadCount,
} from "@/hooks/notifications/useNotifications";
import { useWebSocketNotifications } from "@/hooks/notifications/useWebSocketNotifications";
import { formatRelativeTime } from "@/utils/time";
import type { Notification } from "@/types/notification.types";

// ─── Type / Priority meta ───────────────────────────────────────────────────

const TYPE_META: Record<
  Notification["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  course:     { icon: BookOpen,      color: "text-blue-500",   bg: "bg-blue-100 dark:bg-blue-900/40"    },
  assignment: { icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/40" },
  test:       { icon: FileQuestion,  color: "text-teal-500",   bg: "bg-teal-100 dark:bg-teal-900/40"    },
  grade:      { icon: Star,          color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/40" },
  attendance: { icon: UserCircle,    color: "text-green-500",  bg: "bg-green-100 dark:bg-green-900/40"  },
  system:     { icon: Info,          color: "text-slate-500",  bg: "bg-slate-100 dark:bg-slate-800/60"  },
};

const PRIORITY_ROW_CLS: Record<string, string> = {
  high:   "border-l-2 border-l-yellow-400",
  urgent: "border-l-2 border-l-red-500 bg-red-50/50 dark:bg-red-950/10",
};

// ─── Role-based "see all" path ──────────────────────────────────────────────

function getNotifHref(user: ReturnType<typeof useAuth>["user"]): string {
  const norm = (s?: string) => s?.toUpperCase().replace(/^ROLE_/, "") ?? "";
  const has   = (role: string) =>
    user?.roles?.some((r) => norm(r.name) === role || norm(r.code) === role) ?? false;
  if (has("STUDENT"))                                         return "/student/notifications";
  if (has("TEACHER"))                                         return "/teacher/notifications";
  if (has("ADMIN") || has("SUPER_ADMIN") || has("METODIST")) return "/admin/notifications";
  return "/student/notifications";
}

// ─── Single notification row ────────────────────────────────────────────────

function NotifRow({
  notif,
  onClick,
}: {
  notif: Notification;
  onClick: (notif: Notification) => void;
}) {
  const meta    = TYPE_META[notif.type] ?? TYPE_META.system;
  const Icon    = meta.icon;
  const isUnread = !notif.isRead;

  return (
    <button
      onClick={() => onClick(notif)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60",
        isUnread && "bg-blue-50/50 dark:bg-blue-950/10",
        PRIORITY_ROW_CLS[notif.priority] ?? "",
      )}
    >
      <div className={cn("shrink-0 mt-0.5 rounded-lg p-1.5", meta.bg)}>
        <Icon className={cn("h-3.5 w-3.5", meta.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm leading-snug line-clamp-1",
            isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
          )}>
            {notif.title}
          </p>
          {isUnread && (
            <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {formatRelativeTime(notif.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { user }        = useAuth();
  const navigate        = useNavigate();

  // WebSocket real-time push — server bildirishnoma yuborganda cache invalidate bo'ladi
  useWebSocketNotifications();

  const {
    data: unreadData,
    refetch: refetchCount,
    isFetching: isCountFetching,
  } = useUnreadCount();

  const {
    data: notifications = [],
    isLoading,
    isFetching: isNotifFetching,
    refetch: refetchNotifs,
  } = useNotifications();

  const markAsRead    = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount   = unreadData?.count ?? 0;
  const recent        = notifications.slice(0, 8);
  const notifHref     = getNotifHref(user);

  // Fon yangilanishi borayotganini ko'rsatish uchun
  const isRefreshing = (isCountFetching || isNotifFetching) && !isLoading;

  // ── Panel ochilganda darhol yangilash ────────────────────────────
  useEffect(() => {
    if (open) {
      refetchCount();
      refetchNotifs();
    }
  }, [open, refetchCount, refetchNotifs]);

  // ── Yangi bildirishnoma kelganda toast ───────────────────────────
  const prevCountRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Dastlabki yuklanishda toast ko'rsatmaymiz
    if (prevCountRef.current === undefined) {
      prevCountRef.current = unreadCount;
      return;
    }
    // Son oshgan bo'lsa — yangi bildirishnoma kelgan
    if (unreadCount > prevCountRef.current) {
      const diff = unreadCount - prevCountRef.current;
      toast(`${diff} ta yangi bildirishnoma`, {
        description: "Bildirishnomalar panelini oching",
        action: {
          label: "Ko'rish",
          onClick: () => setOpen(true),
        },
        duration: 5000,
      });
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleNotifClick = (notif: Notification) => {
    if (!notif.isRead) markAsRead.mutate(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
      setOpen(false);
    }
  };

  const handleMarkAll = () => markAllAsRead.mutate();

  const handleManualRefresh = () => {
    refetchCount();
    refetchNotifs();
  };

  const handleSeeAll = () => {
    navigate(notifHref);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ── Trigger: bell + dinamik badge ──────────────────────── */}
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9"
          aria-label="Bildirishnomalar"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* ── Panel ─────────────────────────────────────────────── */}
      <PopoverContent
        className="w-80 sm:w-[22rem] p-0 shadow-xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Bildirishnomalar</h3>
            {unreadCount > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-[11px] bg-red-500 text-white rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            {/* Fon yangilanishi indikatori */}
            {isRefreshing && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground/50" />
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Qo'lda yangilash tugmasi */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Yangilash"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            </Button>

            {/* Barchasini o'qildi */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={handleMarkAll}
                disabled={markAllAsRead.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Barchasini o'qildi
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Bildirishnomalar ro'yxati */}
        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Yuklanmoqda...
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <BellOff className="h-9 w-9 opacity-30" />
              <p className="text-sm">Hozircha bildirishnoma yo'q</p>
            </div>
          ) : (
            <div className="divide-y">
              {recent.map((notif) => (
                <NotifRow key={notif.id} notif={notif} onClick={handleNotifClick} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <Button
          variant="ghost"
          className="w-full h-9 rounded-none rounded-b-[inherit] text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={handleSeeAll}
        >
          Barcha bildirishnomalar
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
