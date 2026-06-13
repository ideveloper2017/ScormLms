import { useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle, Save, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type AttStatus = "present" | "absent" | "late" | "excused";

interface AttRecord {
  id: number;
  name: string;
  status: AttStatus;
}

const LESSONS = [
  { id: "1", label: "08:00 – JavaScript Asoslari (CS-22-01, B-105)", date: "2025-06-13" },
  { id: "2", label: "11:00 – React Development (CS-22-02, Lab-2)",   date: "2025-06-13" },
  { id: "3", label: "14:00 – Node.js Backend (CS-21-03, B-201)",     date: "2025-06-13" },
];

const INITIAL: AttRecord[] = [
  { id: 1,  name: "Alisher Karimov",  status: "present" },
  { id: 2,  name: "Malika Tosheva",   status: "present" },
  { id: 3,  name: "Bobur Rahimov",    status: "absent"  },
  { id: 4,  name: "Dilnoza Yusupova", status: "present" },
  { id: 5,  name: "Jasur Mirzayev",   status: "late"    },
  { id: 6,  name: "Nodira Saidova",   status: "present" },
  { id: 7,  name: "Sarvar Umarov",    status: "absent"  },
  { id: 8,  name: "Kamola Ruziyeva",  status: "present" },
  { id: 9,  name: "Ibrohim Tursunov", status: "excused" },
  { id: 10, name: "Laylo Ergasheva",  status: "present" },
];

const BTN: Record<AttStatus, { label: string; icon: React.ElementType; cls: string; active: string }> = {
  present: { label: "Keldi",       icon: CheckCircle2, cls: "border-green-200  hover:bg-green-50",  active: "bg-green-100  text-green-800  border-green-400"  },
  absent:  { label: "Kelmadi",     icon: XCircle,      cls: "border-red-200    hover:bg-red-50",    active: "bg-red-100    text-red-800    border-red-400"    },
  late:    { label: "Kech keldi",  icon: Clock,        cls: "border-yellow-200 hover:bg-yellow-50", active: "bg-yellow-100 text-yellow-800 border-yellow-400" },
  excused: { label: "Sababli",     icon: AlertCircle,  cls: "border-blue-200   hover:bg-blue-50",   active: "bg-blue-100   text-blue-800   border-blue-400"   },
};

const STATUS_ORDER: AttStatus[] = ["present", "absent", "late", "excused"];

export function TeacherAttendance() {
  const { toast } = useToast();
  const [lesson, setLesson] = useState(LESSONS[0].id);
  const [records, setRecords] = useState<AttRecord[]>(INITIAL);
  const [saving, setSaving] = useState(false);

  const setStatus = (id: number, status: AttStatus) =>
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const markAll = (status: AttStatus) =>
    setRecords((prev) => prev.map((r) => ({ ...r, status })));

  const stats = {
    present: records.filter((r) => r.status === "present").length,
    absent:  records.filter((r) => r.status === "absent").length,
    late:    records.filter((r) => r.status === "late").length,
    excused: records.filter((r) => r.status === "excused").length,
    total:   records.length,
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: "Davomat saqlandi", description: `${stats.present}/${stats.total} talaba keldi` });
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Davomat</h1>
          <p className="text-muted-foreground">Dars davomati belgilash</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />{saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Dars tanlash</label>
        <Select value={lesson} onValueChange={setLesson}>
          <SelectTrigger className="max-w-lg"><SelectValue /></SelectTrigger>
          <SelectContent>{LESSONS.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(["present", "absent", "late", "excused"] as const).map((s) => {
          const m = BTN[s];
          const Icon = m.icon;
          return (
            <Card key={s}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />{m.label}
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats[s]}</div></CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium self-center text-muted-foreground mr-1">Barchasini:</span>
        {STATUS_ORDER.map((s) => {
          const m = BTN[s];
          const Icon = m.icon;
          return (
            <Button key={s} variant="outline" size="sm" className={`gap-1.5 h-8 text-xs ${m.cls}`} onClick={() => markAll(s)}>
              <Icon className="h-3.5 w-3.5" />{m.label}
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />Talabalar ro'yxati
          </CardTitle>
          <CardDescription>{stats.total} talaba · {Math.round((stats.present / stats.total) * 100)}% davomat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {records.map((r) => {
            const cur = BTN[r.status];
            const CurIcon = cur.icon;
            return (
              <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${cur.active}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-6 text-xs text-center font-medium">{r.id}.</span>
                  <span className="font-medium text-sm">{r.name}</span>
                </div>
                <div className="flex gap-1">
                  {STATUS_ORDER.map((s) => {
                    const m = BTN[s];
                    const Icon = m.icon;
                    const isActive = r.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(r.id, s)}
                        title={m.label}
                        className={`rounded-md p-1.5 border text-xs transition-colors ${isActive ? m.active : "border-transparent text-muted-foreground hover:bg-muted"}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
                <Badge className={`${cur.active.split(" ").slice(0, 2).join(" ")} text-xs`}>
                  {cur.label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}