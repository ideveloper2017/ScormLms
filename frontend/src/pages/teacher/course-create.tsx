import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";
import { subjectGroupApi } from "@/services/api/subject-group-api";

export function TeacherCourseCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", subjectGroupId: "", startDate: "", endDate: "",
  });
  const teachingOptions = useQuery({
    queryKey: ["subject-groups", "teaching-options"],
    queryFn: subjectGroupApi.teachingOptions,
  });
  const selectedGroup = (teachingOptions.data ?? []).find(item => String(item.id) === form.subjectGroupId);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Kurs nomi majburiy" }); return; }
    if (!form.subjectGroupId) { toast({ variant: "destructive", title: "Sizga biriktirilgan fan guruhi majburiy" }); return; }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast({ variant: "destructive", title: "Tugash sanasi boshlanish sanasidan oldin bo'lmaydi" });
      return;
    }
    setSaving(true);
    try {
      const created = await teacherPortalApi.createCourse({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        subjectGroupId: Number(form.subjectGroupId),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      toast({ title: "Kurs qoralama sifatida yaratildi", description: created.title });
      navigate(`/teacher/courses/${created.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Kurs yaratilmadi",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
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
          <div className="space-y-1.5">
            <Label>Biriktirilgan fan guruhi <span className="text-destructive">*</span></Label>
            <Select value={form.subjectGroupId} onValueChange={(value) => set("subjectGroupId", value)} disabled={teachingOptions.isLoading}>
              <SelectTrigger><SelectValue placeholder="Fan oqimini tanlang" /></SelectTrigger>
              <SelectContent>{(teachingOptions.data ?? []).map(group => (
                <SelectItem key={group.id} value={String(group.id)}>
                  {group.subjectCode} · {group.subjectName} · {group.code}
                </SelectItem>
              ))}</SelectContent>
            </Select>
            {!teachingOptions.isLoading && teachingOptions.data?.length === 0 && <p className="text-xs text-destructive">Sizga tasdiqlangan curriculum bo'yicha faol fan guruhi biriktirilmagan. Administratorga murojaat qiling.</p>}
          </div>
          {selectedGroup && <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Dastur:</span> {selectedGroup.programName}</p>
            <p><span className="text-muted-foreground">O'quv yili:</span> {selectedGroup.academicYear}</p>
            <p><span className="text-muted-foreground">Semestr:</span> {selectedGroup.semester}</p>
            <p><span className="text-muted-foreground">Kredit:</span> {selectedGroup.credits}</p>
            <p><span className="text-muted-foreground">Til:</span> {selectedGroup.programLanguage}</p>
            <p><span className="text-muted-foreground">Turi:</span> {selectedGroup.planItemType === "REQUIRED" ? "Majburiy" : "Tanlov"}</p>
          </div>}
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
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate("/teacher/courses")}>Bekor qilish</Button>
        <Button onClick={handleSave} disabled={saving || !form.subjectGroupId} className="gap-2">
          <Save className="h-4 w-4" />{saving ? "Saqlanmoqda..." : "Kurs yaratish"}
        </Button>
      </div>
    </div>
  );
}
