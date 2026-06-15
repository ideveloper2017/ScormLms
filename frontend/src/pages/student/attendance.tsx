import { useState } from "react";
import { UserCheck, UserX, Minus, TrendingDown, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubjectAttendance {
  subject: string;
  total: number;
  attended: number;
  excused: number;
  records: { date: string; status: "present" | "absent" | "excused" | "late" }[];
}

const ATTENDANCE: SubjectAttendance[] = [
  {
    subject: "Dasturlash asoslari",
    total: 28, attended: 26, excused: 1,
    records: [
      { date: "2025-06-02", status: "present" }, { date: "2025-06-04", status: "present" },
      { date: "2025-06-09", status: "present" }, { date: "2025-06-11", status: "late"    },
      { date: "2025-06-16", status: "absent"  }, { date: "2025-06-18", status: "present" },
    ],
  },
  {
    subject: "Ma'lumotlar bazasi",
    total: 24, attended: 21, excused: 2,
    records: [
      { date: "2025-06-03", status: "present" }, { date: "2025-06-05", status: "present" },
      { date: "2025-06-10", status: "excused" }, { date: "2025-06-12", status: "present" },
      { date: "2025-06-17", status: "absent"  },
    ],
  },
  {
    subject: "Algoritmlar nazariyasi",
    total: 30, attended: 30, excused: 0,
    records: [
      { date: "2025-06-02", status: "present" }, { date: "2025-06-06", status: "present" },
      { date: "2025-06-09", status: "present" }, { date: "2025-06-13", status: "present" },
    ],
  },
  {
    subject: "Web dasturlash",
    total: 20, attended: 16, excused: 1,
    records: [
      { date: "2025-06-04", status: "present" }, { date: "2025-06-07", status: "absent"  },
      { date: "2025-06-11", status: "present" }, { date: "2025-06-14", status: "absent"  },
      { date: "2025-06-18", status: "late"    },
    ],
  },
  {
    subject: "Fizika",
    total: 22, attended: 18, excused: 3,
    records: [
      { date: "2025-06-03", status: "present" }, { date: "2025-06-05", status: "excused" },
      { date: "2025-06-10", status: "present" }, { date: "2025-06-12", status: "absent"  },
      { date: "2025-06-17", status: "present" },
    ],
  },
  {
    subject: "Matematik tahlil",
    total: 26, attended: 23, excused: 1,
    records: [
      { date: "2025-06-02", status: "present" }, { date: "2025-06-04", status: "present" },
      { date: "2025-06-09", status: "late"    }, { date: "2025-06-11", status: "present" },
      { date: "2025-06-16", status: "absent"  },
    ],
  },
];

const STATUS_META = {
  present: { label: "Keldi",         icon: UserCheck,     cls: "bg-green-500",  textCls: "text-green-600" },
  absent:  { label: "Kelmadi",       icon: UserX,         cls: "bg-red-500",    textCls: "text-red-600"   },
  excused: { label: "Sababli",       icon: Minus,         cls: "bg-blue-400",   textCls: "text-blue-600"  },
  late:    { label: "Kech keldi",    icon: AlertTriangle, cls: "bg-yellow-400", textCls: "text-yellow-600"},
};

const MONTHS_UZ = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];

function getAttRate(a: SubjectAttendance) {
  return Math.round(((a.attended + a.excused) / a.total) * 100);
}

export function StudentAttendance() {
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  const totalAtt = ATTENDANCE.reduce((s, a) => s + a.attended, 0);
  const totalLessons = ATTENDANCE.reduce((s, a) => s + a.total, 0);
  const totalAbsent = ATTENDANCE.reduce((s, a) => s + (a.total - a.attended - a.excused), 0);
  const overallRate = Math.round((totalAtt / totalLessons) * 100);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Davomat</h1>
        <p className="text-muted-foreground">Fan bo'yicha davomat holati</p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jami davomat", value: `${overallRate}%`, cls: overallRate >= 80 ? "text-green-600" : "text-red-600" },
          { label: "Qatnashdi", value: totalAtt, cls: "text-green-600" },
          { label: "Qo'shilmadi", value: totalAbsent, cls: "text-red-600" },
          { label: "Jami darslar", value: totalLessons, cls: "" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Warning for low attendance */}
      {ATTENDANCE.some((a) => getAttRate(a) < 75) && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Davomat ogohlantirishi</div>
            <div className="text-sm mt-0.5">
              {ATTENDANCE.filter((a) => getAttRate(a) < 75).map((a) => a.subject).join(", ")} — davomat 75% dan past.
              Imtihonga ruxsat berilmasligi mumkin.
            </div>
          </div>
        </div>
      )}

      {/* Per-subject table */}
      <div className="space-y-3">
        {ATTENDANCE.map((a) => {
          const rate = getAttRate(a);
          const absent = a.total - a.attended - a.excused;
          const isLow = rate < 75;

          return (
            <Card key={a.subject} className={isLow ? "border-red-200 dark:border-red-900/50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{a.subject}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${isLow ? "text-red-600" : "text-green-600"}`}>{rate}%</span>
                    {isLow && <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">Kam!</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={rate} className={cn("h-2", isLow && "[&>div]:bg-red-500")} />
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: "Jami",        value: a.total,    cls: "" },
                    { label: "Keldi",       value: a.attended, cls: "text-green-600" },
                    { label: "Sababli",     value: a.excused,  cls: "text-blue-600"  },
                    { label: "Kelmadi",     value: absent,     cls: "text-red-600"   },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-muted/50 rounded-md py-2">
                      <div className={`font-bold text-base ${cls}`}>{value}</div>
                      <div className="text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent records */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Oxirgi yozuvlar</div>
                  <div className="flex flex-wrap gap-2">
                    {a.records.slice(-8).map((r, i) => {
                      const meta = STATUS_META[r.status];
                      const d = new Date(r.date);
                      return (
                        <div
                          key={i}
                          title={`${d.getDate()} ${MONTHS_UZ[d.getMonth()]} — ${meta.label}`}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${meta.cls}`} />
                          <span className="text-[10px] text-muted-foreground">{d.getDate()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                      <div key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${meta.cls}`} />
                        {meta.label}
                      </div>
                    ))}
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