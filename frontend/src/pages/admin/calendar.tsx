import { useState } from "react";
import { Calendar, Plus, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AcademicEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  type: "semester" | "exam" | "holiday" | "event";
  description?: string;
}

const EVENTS: AcademicEvent[] = [
  { id: 1, title: "1-semestr",           startDate: "2024-09-02", endDate: "2025-01-18", type: "semester", description: "Kuz-qish semestri" },
  { id: 2, title: "Kuzgi imtihonlar",    startDate: "2025-01-20", endDate: "2025-02-08", type: "exam",     description: "Yakuniy imtihonlar davri" },
  { id: 3, title: "2-semestr",           startDate: "2025-02-10", endDate: "2025-06-14", type: "semester", description: "Bahor-yoz semestri" },
  { id: 4, title: "Bahorgi imtihonlar",  startDate: "2025-06-16", endDate: "2025-07-05", type: "exam",     description: "Yakuniy imtihonlar davri" },
  { id: 5, title: "Yangi yil ta'tili",   startDate: "2025-01-01", endDate: "2025-01-03", type: "holiday" },
  { id: 6, title: "Navro'z ta'tili",     startDate: "2025-03-21", endDate: "2025-03-23", type: "holiday" },
  { id: 7, title: "9-may ta'tili",       startDate: "2025-05-09", endDate: "2025-05-09", type: "holiday" },
  { id: 8, title: "Mustaqillik kuni",    startDate: "2025-09-01", endDate: "2025-09-01", type: "holiday" },
  { id: 9, title: "Ilmiy konferensiya",  startDate: "2025-04-15", endDate: "2025-04-16", type: "event",    description: "Yillik ilmiy konferensiya" },
  { id: 10, title: "Talabalar olimpiadasi", startDate: "2025-03-10", endDate: "2025-03-12", type: "event", description: "Dasturlash olimpiadasi" },
];

const TYPE_META: Record<string, { label: string; cls: string; dot: string }> = {
  semester: { label: "Semestr",   cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300",   dot: "bg-blue-500"   },
  exam:     { label: "Imtihon",   cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300",    dot: "bg-red-500"    },
  holiday:  { label: "Ta'til",    cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",  dot: "bg-green-500"  },
  event:    { label: "Tadbir",    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", dot: "bg-purple-500" },
};

const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

function fmtDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}`;
}

export function AdminCalendar() {
  const [yearOffset, setYearOffset] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const currentYear = new Date().getFullYear() + yearOffset;

  const filtered = EVENTS.filter((e) => {
    const year = new Date(e.startDate).getFullYear();
    const matchYear = year === currentYear || new Date(e.endDate).getFullYear() === currentYear;
    const matchType = filter === "all" || e.type === filter;
    return matchYear && matchType;
  });

  const grouped = filtered.reduce<Record<number, AcademicEvent[]>>((acc, e) => {
    const month = new Date(e.startDate).getMonth();
    (acc[month] ??= []).push(e);
    return acc;
  }, {});

  const stats = {
    semester: EVENTS.filter((e) => e.type === "semester").length,
    exam:     EVENTS.filter((e) => e.type === "exam").length,
    holiday:  EVENTS.filter((e) => e.type === "holiday").length,
    event:    EVENTS.filter((e) => e.type === "event").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Akademik Kalendar</h1>
          <p className="text-muted-foreground">Semestrlar, imtihonlar va muhim sanalar</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />Yangi Tadbir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(stats) as [string, number][]).map(([type, count]) => {
          const meta = TYPE_META[type];
          return (
            <Card key={type} className="cursor-pointer" onClick={() => setFilter(filter === type ? "all" : type)}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`w-3 h-3 rounded-full ${meta.dot}`} />
                <div>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{meta.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Year navigator */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setYearOffset((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xl font-bold min-w-[80px] text-center">{currentYear}</span>
        <Button variant="outline" size="icon" onClick={() => setYearOffset((y) => y + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex gap-2 ml-2">
          {Object.entries(TYPE_META).map(([type, meta]) => (
            <Badge
              key={type}
              className={`cursor-pointer ${filter === type ? meta.cls : "bg-muted text-muted-foreground"}`}
              onClick={() => setFilter(filter === type ? "all" : type)}
            >
              {meta.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Monthly timeline */}
      <div className="space-y-4">
        {MONTHS_UZ.map((month, idx) => {
          const events = grouped[idx];
          if (!events?.length) return null;
          return (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {month} {currentYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {events.map((event) => {
                  const meta = TYPE_META[event.type];
                  const same = event.startDate === event.endDate;
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge className={meta.cls + " text-xs"}>{meta.label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <Flag className="h-3 w-3 inline mr-1" />
                          {same ? fmtDate(event.startDate) : `${fmtDate(event.startDate)} — ${fmtDate(event.endDate)}`}
                        </div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{event.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {currentYear} uchun tadbirlar topilmadi
        </div>
      )}
    </div>
  );
}
