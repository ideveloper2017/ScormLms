import { useState } from "react";
import { Download, Search, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface StudentRecord {
  id: number;
  name: string;
  group: string;
  hw1: number | null;
  hw2: number | null;
  midterm: number | null;
  lab1: number | null;
  final: number | null;
}

const HW_MAX = 100;
const MID_MAX = 100;
const LAB_MAX = 100;
const FIN_MAX = 100;

const STUDENTS: StudentRecord[] = [
  { id: 1,  name: "Alisher Karimov",  group: "CS-22-01", hw1: 92, hw2: 88, midterm: 74, lab1: 95, final: 80 },
  { id: 2,  name: "Malika Tosheva",   group: "CS-22-01", hw1: 85, hw2: 95, midterm: 82, lab1: 90, final: 91 },
  { id: 3,  name: "Bobur Rahimov",    group: "CS-22-01", hw1: 70, hw2: 65, midterm: 68, lab1: 72, final: 65 },
  { id: 4,  name: "Dilnoza Yusupova", group: "CS-22-01", hw1: 98, hw2: 95, midterm: 92, lab1: 98, final: 96 },
  { id: 5,  name: "Jasur Mirzayev",   group: "CS-22-01", hw1: 78, hw2: 82, midterm: 75, lab1: 80, final: null },
  { id: 6,  name: "Nodira Saidova",   group: "CS-22-01", hw1: 88, hw2: 90, midterm: 85, lab1: 87, final: 89 },
  { id: 7,  name: "Sarvar Umarov",    group: "CS-22-01", hw1: 60, hw2: 55, midterm: 63, lab1: 68, final: 58 },
  { id: 8,  name: "Zulfiya Xoliqova", group: "CS-22-02", hw1: 95, hw2: 92, midterm: 88, lab1: 94, final: 93 },
  { id: 9,  name: "Doniyor Ergashev", group: "CS-22-02", hw1: 72, hw2: 78, midterm: 70, lab1: 75, final: 74 },
  { id: 10, name: "Feruza Nazarova",  group: "CS-22-02", hw1: 83, hw2: 87, midterm: 80, lab1: 85, final: 82 },
];

const COURSES = ["JavaScript Asoslari", "React Development", "Node.js Backend", "TypeScript Advanced"];
const GROUPS  = ["CS-22-01", "CS-22-02", "CS-22-03", "CS-21-03"];

function avg(r: StudentRecord) {
  const vals = [r.hw1, r.hw2, r.midterm, r.lab1, r.final].filter((v): v is number => v !== null);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

function grade(score: number | null) {
  if (score === null) return { label: "—",  cls: "text-muted-foreground" };
  if (score >= 90) return { label: "A'lo",  cls: "text-green-600 font-bold" };
  if (score >= 75) return { label: "Yaxshi",cls: "text-blue-600 font-semibold" };
  if (score >= 60) return { label: "Qoniq", cls: "text-yellow-600" };
  return              { label: "Qoniq.", cls: "text-red-600" };
}

function cellCls(v: number | null, max = 100) {
  if (v === null) return "text-muted-foreground text-center";
  const pct = (v / max) * 100;
  if (pct >= 90) return "text-green-600 text-center font-medium";
  if (pct >= 75) return "text-blue-600 text-center";
  if (pct >= 60) return "text-yellow-600 text-center";
  return "text-red-600 text-center";
}

export function TeacherGradebook() {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [course, setCourse] = useState(COURSES[0]);

  const filtered = STUDENTS.filter((s) => {
    const t = search.toLowerCase();
    return (
      (!t || s.name.toLowerCase().includes(t)) &&
      (group === "all" || s.group === group)
    );
  });

  const classAvg = (key: keyof StudentRecord) => {
    const vals = filtered.map((s) => s[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Baholash jurnali</h1>
          <p className="text-muted-foreground">Talabalar baholarini boshqarish</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />Excel yuklash
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Jami talabalar", value: filtered.length,                                        cls: "" },
          { label: "O'rtacha ball",  value: classAvg("midterm") ?? "—",                             cls: "text-blue-600" },
          { label: "A'lochi (%)",    value: `${Math.round(filtered.filter((s) => (avg(s) ?? 0) >= 90).length / (filtered.length || 1) * 100)}%`, cls: "text-green-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha guruhlar</SelectItem>
            {GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Talaba ismi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Talaba</TableHead>
                  <TableHead className="text-center w-24">UZ-1</TableHead>
                  <TableHead className="text-center w-24">UZ-2</TableHead>
                  <TableHead className="text-center w-24">Oraliq</TableHead>
                  <TableHead className="text-center w-24">Lab</TableHead>
                  <TableHead className="text-center w-24">Yakuniy</TableHead>
                  <TableHead className="text-center w-24">O'rtacha</TableHead>
                  <TableHead className="text-center w-24">Baho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, i) => {
                  const a = avg(s);
                  const g = grade(a);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-center text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.group}</div>
                      </TableCell>
                      <TableCell className={cellCls(s.hw1)}>{s.hw1 ?? "—"}</TableCell>
                      <TableCell className={cellCls(s.hw2)}>{s.hw2 ?? "—"}</TableCell>
                      <TableCell className={cellCls(s.midterm)}>{s.midterm ?? "—"}</TableCell>
                      <TableCell className={cellCls(s.lab1)}>{s.lab1 ?? "—"}</TableCell>
                      <TableCell className={cellCls(s.final)}>{s.final ?? "—"}</TableCell>
                      <TableCell className={`${cellCls(a)} font-semibold`}>{a ?? "—"}</TableCell>
                      <TableCell className={`text-center text-xs ${g.cls}`}>{g.label}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell />
                  <TableCell className="text-sm">Sinf o'rtachasi</TableCell>
                  <TableCell className="text-center text-sm">{classAvg("hw1") ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">{classAvg("hw2") ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">{classAvg("midterm") ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">{classAvg("lab1") ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">{classAvg("final") ?? "—"}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}