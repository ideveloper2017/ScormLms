import { useMemo } from "react";
import { UserCheck, UserX, Minus, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAttendance, useAttendanceStats } from "@/hooks/attendance/useAttendance";
import { DashboardStatsSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttendanceRecord } from "@/types/attendance.types";

const STATUS_META = {
  present: { label: "Keldi",         icon: UserCheck,     cls: "bg-green-500",  textCls: "text-green-600" },
  absent:  { label: "Kelmadi",       icon: UserX,         cls: "bg-red-500",    textCls: "text-red-600"   },
  excused: { label: "Sababli",       icon: Minus,         cls: "bg-blue-400",   textCls: "text-blue-600"  },
  late:    { label: "Kech keldi",    icon: AlertTriangle, cls: "bg-yellow-400", textCls: "text-yellow-600"},
};

const MONTHS_UZ = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];

interface CourseAttendanceData {
  courseId: string;
  courseName: string;
  totalClasses: number;
  attended: number;
  absent: number;
  excused: number;
  late: number;
  percentage: number;
  records: AttendanceRecord[];
}

export function StudentAttendance() {
  // Fetch attendance data using hooks
  const { data: attendanceRecords, isLoading: isLoadingRecords, error: recordsError, refetch: refetchRecords } = useAttendance();
  const { data: stats, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useAttendanceStats();

  // Group attendance records by course
  const courseAttendanceData = useMemo(() => {
    if (!attendanceRecords || !stats) return [];

    const courseMap = new Map<string, CourseAttendanceData>();

    // Initialize courses from stats
    stats.byCourse.forEach(courseStat => {
      courseMap.set(courseStat.courseId, {
        courseId: courseStat.courseId,
        courseName: courseStat.courseName,
        totalClasses: courseStat.totalClasses,
        attended: courseStat.attended,
        absent: 0,
        excused: 0,
        late: 0,
        percentage: courseStat.percentage,
        records: [],
      });
    });

    // Populate records and count statuses
    attendanceRecords.forEach(record => {
      const courseData = courseMap.get(record.courseId);
      if (courseData) {
        courseData.records.push(record);
        
        // Count status types
        if (record.status === 'absent') courseData.absent++;
        else if (record.status === 'excused') courseData.excused++;
        else if (record.status === 'late') courseData.late++;
      }
    });

    return Array.from(courseMap.values());
  }, [attendanceRecords, stats]);

  // Calculate overall statistics
  const overallRate = stats?.attendancePercentage ?? 0;
  const totalAtt = stats?.attended ?? 0;
  const totalAbsent = stats?.absent ?? 0;
  const totalLessons = stats?.totalClasses ?? 0;

  // Loading state
  if (isLoadingRecords || isLoadingStats) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Davomat</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Fan bo'yicha davomat holati</p>
        </div>

        {/* Stats skeleton */}
        <DashboardStatsSkeleton count={4} />

        {/* Course cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-2 w-full" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-16 w-full rounded-md" />
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((k) => (
                      <Skeleton key={k} className="h-6 w-6 rounded-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (recordsError || statsError) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Davomat</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Fan bo'yicha davomat holati</p>
        </div>
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-start gap-3 text-red-600">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Davomat ma'lumotlarini yuklashda xatolik</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {recordsError?.message || statsError?.message || "Iltimos, keyinroq qayta urinib ko'ring"}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  refetchRecords();
                  refetchStats();
                }} 
                variant="outline"
                disabled={isLoadingRecords || isLoadingStats}
              >
                {isLoadingRecords || isLoadingStats ? "Yuklanmoqda..." : "Qayta urinish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find courses with low attendance
  const lowAttendanceCourses = courseAttendanceData.filter(c => c.percentage < 75);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Davomat</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Fan bo'yicha davomat holati</p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Jami davomat", value: `${Math.round(overallRate)}%`, cls: overallRate >= 80 ? "text-green-600" : "text-red-600" },
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
      {lowAttendanceCourses.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Davomat ogohlantirishi</div>
            <div className="text-sm mt-0.5">
              {lowAttendanceCourses.map((c) => c.courseName).join(", ")} — davomat 75% dan past.
              Imtihonga ruxsat berilmasligi mumkin.
            </div>
          </div>
        </div>
      )}

      {/* Per-course table */}
      <div className="space-y-3">
        {courseAttendanceData.map((courseData) => {
          const rate = Math.round(courseData.percentage);
          const isLow = rate < 75;

          return (
            <Card key={courseData.courseId} className={isLow ? "border-red-200 dark:border-red-900/50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{courseData.courseName}</CardTitle>
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
                    { label: "Jami",        value: courseData.totalClasses,    cls: "" },
                    { label: "Keldi",       value: courseData.attended, cls: "text-green-600" },
                    { label: "Sababli",     value: courseData.excused,  cls: "text-blue-600"  },
                    { label: "Kelmadi",     value: courseData.absent,     cls: "text-red-600"   },
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
                    {courseData.records
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .slice(0, 8)
                      .reverse()
                      .map((record) => {
                        const meta = STATUS_META[record.status];
                        const d = record.date;
                        return (
                          <div
                            key={record.id}
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