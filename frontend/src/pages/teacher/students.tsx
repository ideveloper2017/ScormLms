import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, MessageCircle, ChevronRight, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:    { label: "Faol",         cls: "bg-green-100  text-green-800"  },
  atrisk:    { label: "Xavf ostida",  cls: "bg-orange-100 text-orange-800" },
  "at-risk": { label: "Xavf ostida",  cls: "bg-orange-100 text-orange-800" },
  inactive:  { label: "Faolsiz",      cls: "bg-red-100    text-red-800"    },
  excellent: { label: "A'lo",         cls: "bg-blue-100   text-blue-800"   },
};

export function TeacherStudents() {
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");

  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.students(),
    queryFn: () => teacherPortalApi.getStudents(),
    staleTime: 60_000,
  });

  const filtered = students.filter((s) => {
    const t = search.toLowerCase();
    return (
      (!t || s.fullName.toLowerCase().includes(t)) &&
      (statusF === "all" || s.status === statusF || (statusF === "atrisk" && s.status === "at-risk"))
    );
  });

  const stats = {
    total:    students.length,
    active:   students.filter((s) => s.status === "active" || s.status === "excellent").length,
    atRisk:   students.filter((s) => s.status === "at-risk").length,
    inactive: 0,
  };

  if (isLoading) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
    </div>
  );

  if (error) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Talabalar</h1>
      <Card className="border-destructive/50">
        <CardContent className="pt-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Talabalar</h1>
        <p className="text-muted-foreground">Barcha kurslardagi talabalar ro'yxati</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Jami",          value: stats.total,    cls: "" },
          { label: "Faol",          value: stats.active,   cls: "text-green-600" },
          { label: "Xavf ostida",   value: stats.atRisk,   cls: "text-orange-600" },
          { label: "Faolsiz",       value: stats.inactive, cls: "text-red-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Talaba ismi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holat</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="at-risk">Xavf ostida</SelectItem>
            <SelectItem value="excellent">A'lo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Talaba topilmadi</p>
      )}

      <div className="space-y-3">
        {filtered.map((s) => {
          const meta = STATUS_META[s.status] ?? STATUS_META['active'];
          return (
          <Card key={s.id} className={s.status === "at-risk" ? "border-orange-200" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm font-bold">
                  {s.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <div className="font-medium text-sm">{s.fullName}</div>
                  {s.groupName && <div className="text-xs text-muted-foreground">{s.groupName}</div>}
                  <Badge className={meta.cls + " text-xs mt-1"}>{meta.label}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ball: {s.avgScore}%</span>
                    <span>Davomat: {s.attendance}%</span>
                  </div>
                  <Progress value={s.attendance} className="h-1.5" />
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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