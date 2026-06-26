import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SUBJECTS = [
  "Dasturlash", "Web dasturlash", "Backend", "Ma'lumotlar bazasi",
  "Matematik tahlil", "Fizika", "Ingliz tili", "Algoritmlar nazariyasi",
];
const GROUPS = ["CS-22-01", "CS-22-02", "CS-22-03", "CS-21-01", "CS-21-02", "CS-23-01"];

export function TeacherCourseCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", subject: "", group: "",
    startDate: "", endDate: "", isPublic: false, hasCertificate: false,
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Kurs nomi majburiy" }); return; }
    if (!form.subject) { toast({ variant: "destructive", title: "Fan majburiy" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast({ title: "Kurs yaratildi", description: form.title });
    navigate("/teacher/courses");
    setSaving(false);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/courses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Yangi Kurs Yaratish</h1>
          <p className="text-muted-foreground text-sm">Kurs ma'lumotlarini to'ldiring</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />Asosiy ma'lumotlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Kurs nomi <span className="text-destructive">*</span></Label>
            <Input placeholder="Masalan: JavaScript Asoslari" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tavsif</Label>
            <Textarea placeholder="Kurs haqida qisqacha ma'lumot..." rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fan <span className="text-destructive">*</span></Label>
              <Select value={form.subject} onValueChange={(v) => set("subject", v)}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Guruh</Label>
              <Select value={form.group} onValueChange={(v) => set("group", v)}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>{GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Boshlanish sanasi</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tugash sanasi</Label>
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Ochiq kurs</Label>
                <p className="text-xs text-muted-foreground">Barcha talabalar ko'ra oladi</p>
              </div>
              <Switch checked={form.isPublic} onCheckedChange={(v) => set("isPublic", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Sertifikat</Label>
                <p className="text-xs text-muted-foreground">Yakunlaganda sertifikat beriladi</p>
              </div>
              <Switch checked={form.hasCertificate} onCheckedChange={(v) => set("hasCertificate", v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate("/teacher/courses")}>Bekor qilish</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />{saving ? "Saqlanmoqda..." : "Kurs yaratish"}
        </Button>
      </div>
    </div>
  );
}
