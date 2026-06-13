import { useState } from "react";
import {
  Search, Users, TrendingUp, TrendingDown, Clock, Eye,
  MessageCircle, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Student {
  id: number;
  name: string;
  group: string;
  course: string;
  avgScore: number;
  attendance: number;
  progress: number;
  lastActive: string;
  status: "active" | "atrisk" | "inactive";
  pendingAssignments: number;
}

const STUDENTS: Student[] = [
  { id: 1,  name: "Alisher Karimov",  group: "CS-22-01", course: "JS Asoslari",  avgScore: 88, attendance: 95, progress: 82, lastActive: "Bugun",        status: "active",   pendingAssignments: 0 },
  { id: 2,  name: "Malika Tosheva",   group: "CS-22-01", course: "JS Asoslari",  avgScore: 94, attendance: 98, progress: 90, lastActive: "Bugun",        status: "active",   pendingAssignments: 0 },
  { id: 3,  name: "Bobur Rahimov",    group: "CS-22-01", course: "JS Asoslari",  avgScore: 65, attendance: 72, progress: 55, lastActive: "3 kun oldin",  status: "atrisk",   pendingAssignments: 3 },
  { id: 4,  name: "Dilnoza Yusupova", group: "CS-22-01", course: "JS Asoslari",  avgScore: 97, attendance: 100,progress: 95, lastActive: "Bugun",        status: "active",   pendingAssignments: 0 },
  { id: 5,  name: "Jasur Mirzayev",   group: "CS-22-01", course: "JS Asoslari",  avgScore: 78, attendance: 88, progress: 70, lastActive: "Kecha",        status: "active",   pendingAssignments: 1 },
  { id: 6,  name: "Nodira Saidova",   group: "CS-22-01", course: "JS Asoslari",  avgScore: 89, attendance: 92, progress: 85, lastActive: "Bugun",        status: "active",   pendingAssignments: 0 },
  { id: 7,  name: "Sarvar Umarov",    group: "CS-22-01", course: "JS Asoslari",  avgScore: 58, attendance: 65, progress: 40, lastActive: "1 hafta oldin",status: "inactive", pendingAssignments: 5 },
  { id: 8,  name: "Zulfiya Xoliqova", group: "CS-22-02", course: "React Dev",    avgScore: 92, attendance: 96, progress: 88, lastActive: "Bugun",        status: "active",   pendingAssignments: 0 },
  { id: 9,  name: "Doniyor Ergashev", group: "CS-22-02", course: "React Dev",    avgScore: 72, attendance: 80, progress: 65, lastActive: "Kecha",        status: "active",   pendingAssignments: 2 },
  { id: 10, name: "Feruza Nazarova",  group: "CS-22-02", course: "React Dev",    avgScore: 83, attendance: 90, progress: 78, lastActive: "Bugun",        status: "active",   pendingAssignments: 1 },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:   { label: "Faol",         cls: "bg-green-100  text-green-800"  },
  atrisk:   { label: "Xavf ostida",  cls: "bg-orange-100 text-orange-800" },
  inactive: { label: "Faolsiz",      cls: "bg-red-100    text-red-800"    },
};

const COURSES  = ["Barchasi", "JS Asoslari", "React Dev", "Node.js", "TypeScript"];
const GROUPS   = ["Barchasi", "CS-22-01", "CS-22-02", "CS-21-03"];

export function TeacherStudents() {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("Barchasi");
  const [grp, setGrp] = useState("Barchasi");
  const [statusF, setStatusF] = useState("all");

  const filtered = STUDENTS.filter((s) => {
    const t = search.toLowerCase();
    return (
      (!t || s.name.toLowerCase().includes(t)) &&
      (course === "Barchasi" || s.course === course) &&
      (grp === "Barchasi" || s.group === grp) &&
      (statusF === "all" || s.status === statusF)
    );
  });

  const stats = {
    total:    STUDENTS.length,
    active:   STUDENTS.filter((s) => s.status === "active").length,
    atRisk:   STUDENTS.filter((s) => s.status === "atrisk").length,
    inactive: STUDENTS.filter((s) => s.status === "inactive").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talabalar</h1>
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

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Talaba ismi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={grp} onValueChange={setGrp}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holat</SelectItem>
            {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id} className={s.status === "atrisk" ? "border-orange-200" : s.status === "inactive" ? "border-red-200" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm font-bold">
                  {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.group} · {s.course}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge className={STATUS_META[s.status].cls + " text-xs"}>{STATUS_META[s.status].label}</Badge>
                    {s.pendingAssignments > 0 && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">{s.pendingAssignments} topshiriq</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{s.progress}%</span>
                  </div>
                  <Progress value={s.progress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ball: {s.avgScore}%</span>
                    <span>Davomat: {s.attendance}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />{s.lastActive}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}