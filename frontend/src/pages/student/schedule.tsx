import { useState, useMemo } from "react";
import { Clock, MapPin, User, ChevronLeft, ChevronRight, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSchedule, useNextClass, useTodaySchedule } from "@/hooks/schedule/useSchedule";
import type { ScheduleItem } from "@/types/schedule.types";
import { toast } from "sonner";

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const TYPE_META: Record<string, { label: string; cls: string }> = {
  lecture:  { label: "Ma'ruza",      cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  tutorial: { label: "Amaliyot",     cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  lab:      { label: "Laboratoriya", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  seminar:  { label: "Seminar",      cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

const TYPE_BG: Record<string, string> = {
  lecture:  "border-l-blue-400   bg-blue-50/60   dark:bg-blue-950/20",
  tutorial: "border-l-green-400  bg-green-50/60  dark:bg-green-950/20",
  lab:      "border-l-purple-400 bg-purple-50/60 dark:bg-purple-950/20",
  seminar:  "border-l-orange-400 bg-orange-50/60 dark:bg-orange-950/20",
};

// Color palette for courses (cycling through for visual distinction)
const COURSE_COLORS = [
  "border-l-blue-400   bg-blue-50/60   dark:bg-blue-950/20",
  "border-l-green-400  bg-green-50/60  dark:bg-green-950/20",
  "border-l-purple-400 bg-purple-50/60 dark:bg-purple-950/20",
  "border-l-orange-400 bg-orange-50/60 dark:bg-orange-950/20",
  "border-l-pink-400   bg-pink-50/60   dark:bg-pink-950/20",
  "border-l-cyan-400   bg-cyan-50/60   dark:bg-cyan-950/20",
  "border-l-yellow-400 bg-yellow-50/60 dark:bg-yellow-950/20",
  "border-l-red-400    bg-red-50/60    dark:bg-red-950/20",
];

const WEEKS_UZ = [
  "2025-yil 9–13 iyun",
  "2025-yil 16–20 iyun",
  "2025-yil 23–27 iyun",
];

// Skeleton component for loading state
function ScheduleSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="border-l-4 rounded-r-lg p-3 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay() - 1 || 0);

  // Fetch schedule data from API
  const { data: schedule, isLoading, error, refetch } = useSchedule();
  const { data: nextClass } = useNextClass();
  const { data: todaySchedule } = useTodaySchedule();

  // All hooks must be called before any conditional returns
  const courseColorMap = useMemo(() => {
    if (!schedule) return {};
    const uniqueCourses = Array.from(new Set(schedule.map((item) => item.courseId)));
    const colorMap: Record<string, string> = {};
    uniqueCourses.forEach((courseId, index) => {
      colorMap[courseId] = COURSE_COLORS[index % COURSE_COLORS.length];
    });
    return colorMap;
  }, [schedule]);

  const organizedSchedule = useMemo(() => {
    if (!schedule) return {};
    const organized: Record<number, ScheduleItem[]> = {};
    schedule.forEach((item) => {
      const day = item.dayOfWeek === 0 ? -1 : item.dayOfWeek - 1;
      if (day >= 0 && day < 6) {
        if (!organized[day]) organized[day] = [];
        organized[day].push(item);
      }
    });
    Object.keys(organized).forEach((day) => {
      organized[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return organized;
  }, [schedule]);

  const todayDay = new Date().getDay() - 1;
  const dayLessons = (day: number) => organizedSchedule[day] || [];
  const todayLessons = todaySchedule || [];
  const totalLessons = schedule?.length || 0;
  const uniqueCourses = schedule ? new Set(schedule.map((l) => l.courseId)).size : 0;
  const totalHours = totalLessons * 1.5;

  // Conditional returns — AFTER all hooks
  if (isLoading) return <ScheduleSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dars jadvali</h1>
          <p className="text-muted-foreground">Haftalik dars jadvali va keyingi darslar</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-destructive">
                {error.message || "Dars jadvalini yuklashda xatolik yuz berdi"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Qayta urinish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dars Jadvali</h1>
          <p className="text-muted-foreground">Haftalik darslar va mashg'ulotlar</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[160px] text-center">
            {WEEKS_UZ[(weekOffset % WEEKS_UZ.length + WEEKS_UZ.length) % WEEKS_UZ.length]}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Bugungi darslar", value: todayLessons.length, cls: "text-blue-600" },
          { label: "Haftalik darslar", value: totalLessons, cls: "" },
          { label: "Fanlar soni", value: uniqueCourses, cls: "text-green-600" },
          { label: "Jami soat", value: `${totalHours}`, cls: "text-purple-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cls}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next upcoming class card */}
      {nextClass && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Keyingi dars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-medium text-lg">{nextClass.courseName}</div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {nextClass.startTime}–{nextClass.endTime}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {nextClass.instructor}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {nextClass.room}
                </div>
                {nextClass.isOnline && (
                  <Badge variant="outline" className="gap-1">
                    <Video className="h-3 w-3" />
                    Online
                  </Badge>
                )}
              </div>
              {nextClass.isOnline && nextClass.meetingLink && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto"
                  onClick={() => window.open(nextClass.meetingLink, '_blank')}
                >
                  Darsga qo'shilish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile: day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {DAYS.map((day, i) => (
          <Button
            key={day}
            variant={selectedDay === i ? "default" : "outline"}
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => setSelectedDay(i)}
          >
            {day.slice(0, 3)}
          </Button>
        ))}
      </div>

      {/* Type legend */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <Badge key={type} className={meta.cls + " text-xs"}>{meta.label}</Badge>
        ))}
      </div>

      {/* Schedule grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(window.innerWidth < 768 ? [selectedDay] : [0, 1, 2, 3, 4, 5]).map((dayIdx) => {
          const lessons = dayLessons(dayIdx);
          const isToday = dayIdx === todayDay;
          return (
            <Card key={dayIdx} className={isToday ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className={cn("text-sm font-semibold flex items-center justify-between", isToday && "text-primary")}>
                  {DAYS[dayIdx]}
                  {isToday && <Badge className="text-xs">Bugun</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Dars yo'q</p>
                ) : (
                  lessons.map((lesson) => {
                    // Use course color for consistent color-coding
                    const courseColor = courseColorMap[lesson.courseId] || TYPE_BG[lesson.type];
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`border-l-4 rounded-r-lg p-3 space-y-1 ${courseColor}`}
                      >
                        <div className="font-medium text-sm leading-tight">{lesson.courseName}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {lesson.startTime}–{lesson.endTime}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />{lesson.instructor}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{lesson.room}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={TYPE_META[lesson.type]?.cls + " text-xs"}>
                            {TYPE_META[lesson.type]?.label || lesson.type}
                          </Badge>
                          {lesson.isOnline && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Video className="h-3 w-3" />
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}