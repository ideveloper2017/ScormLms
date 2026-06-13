import { useState } from "react";
import { Clock, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Lesson {
  id: number;
  subject: string;
  teacher: string;
  room: string;
  type: "lecture" | "practice" | "lab" | "seminar";
  startTime: string;
  endTime: string;
  day: number; // 0=Dushanba, 4=Juma
}

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const TIMES = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00"];

const LESSONS: Lesson[] = [
  { id: 1,  subject: "Matematik tahlil",       teacher: "Prof. Karimov A.",  room: "A-201", type: "lecture",  startTime: "08:00", endTime: "09:20", day: 0 },
  { id: 2,  subject: "Dasturlash asoslari",     teacher: "Dr. Tosheva M.",    room: "B-105", type: "practice", startTime: "09:30", endTime: "10:50", day: 0 },
  { id: 3,  subject: "Fizika",                  teacher: "Prof. Nazarov S.",  room: "A-310", type: "lecture",  startTime: "11:00", endTime: "12:20", day: 0 },
  { id: 4,  subject: "Ingliz tili",             teacher: "Xoliqova D.",       room: "C-102", type: "seminar",  startTime: "14:00", endTime: "15:20", day: 0 },
  { id: 5,  subject: "Algoritmlar nazariyasi",  teacher: "Dr. Rahimov B.",    room: "B-201", type: "lecture",  startTime: "08:00", endTime: "09:20", day: 1 },
  { id: 6,  subject: "Ma'lumotlar bazasi",      teacher: "Prof. Umarov K.",   room: "Lab-1", type: "lab",      startTime: "09:30", endTime: "10:50", day: 1 },
  { id: 7,  subject: "Matematik tahlil",        teacher: "Prof. Karimov A.",  room: "A-201", type: "practice", startTime: "11:00", endTime: "12:20", day: 1 },
  { id: 8,  subject: "Dasturlash asoslari",     teacher: "Dr. Tosheva M.",    room: "Lab-2", type: "lab",      startTime: "08:00", endTime: "09:20", day: 2 },
  { id: 9,  subject: "Fizika",                  teacher: "Prof. Nazarov S.",  room: "Lab-3", type: "lab",      startTime: "09:30", endTime: "10:50", day: 2 },
  { id: 10, subject: "Web dasturlash",          teacher: "Yusupov R.",        room: "Lab-1", type: "practice", startTime: "14:00", endTime: "15:20", day: 2 },
  { id: 11, subject: "Algoritmlar nazariyasi",  teacher: "Dr. Rahimov B.",    room: "B-201", type: "practice", startTime: "08:00", endTime: "09:20", day: 3 },
  { id: 12, subject: "Ma'lumotlar bazasi",      teacher: "Prof. Umarov K.",   room: "B-105", type: "lecture",  startTime: "11:00", endTime: "12:20", day: 3 },
  { id: 13, subject: "Ingliz tili",             teacher: "Xoliqova D.",       room: "C-103", type: "seminar",  startTime: "14:00", endTime: "15:20", day: 3 },
  { id: 14, subject: "Web dasturlash",          teacher: "Yusupov R.",        room: "B-301", type: "lecture",  startTime: "09:30", endTime: "10:50", day: 4 },
  { id: 15, subject: "Fizika",                  teacher: "Prof. Nazarov S.",  room: "A-310", type: "seminar",  startTime: "11:00", endTime: "12:20", day: 4 },
  { id: 16, subject: "Algoritmlar nazariyasi",  teacher: "Dr. Rahimov B.",    room: "Lab-1", type: "lab",      startTime: "08:00", endTime: "09:20", day: 5 },
];

const TYPE_META: Record<string, { label: string; cls: string }> = {
  lecture:  { label: "Ma'ruza",   cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  practice: { label: "Amaliyot",  cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  lab:      { label: "Laboratoriya", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  seminar:  { label: "Seminar",   cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

const TYPE_BG: Record<string, string> = {
  lecture:  "border-l-blue-400   bg-blue-50/60   dark:bg-blue-950/20",
  practice: "border-l-green-400  bg-green-50/60  dark:bg-green-950/20",
  lab:      "border-l-purple-400 bg-purple-50/60 dark:bg-purple-950/20",
  seminar:  "border-l-orange-400 bg-orange-50/60 dark:bg-orange-950/20",
};

const WEEKS_UZ = [
  "2025-yil 9–13 iyun",
  "2025-yil 16–20 iyun",
  "2025-yil 23–27 iyun",
];

export function StudentSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay() - 1 || 0);

  const todayDay = new Date().getDay() - 1;
  const showDays = window.innerWidth < 768 ? [selectedDay] : [0, 1, 2, 3, 4, 5];

  const dayLessons = (day: number) =>
    LESSONS.filter((l) => l.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayLessons = dayLessons(todayDay >= 0 && todayDay < 6 ? todayDay : 0);
  const totalLessons = LESSONS.length;

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
          { label: "Fanlar soni", value: new Set(LESSONS.map((l) => l.subject)).size, cls: "text-green-600" },
          { label: "Jami soat", value: `${totalLessons * 1.5}`, cls: "text-purple-600" },
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
                  lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`border-l-4 rounded-r-lg p-3 space-y-1 ${TYPE_BG[lesson.type]}`}
                    >
                      <div className="font-medium text-sm leading-tight">{lesson.subject}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {lesson.startTime}–{lesson.endTime}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />{lesson.teacher}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{lesson.room}
                        </div>
                      </div>
                      <Badge className={TYPE_META[lesson.type].cls + " text-xs"}>
                        {TYPE_META[lesson.type].label}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}