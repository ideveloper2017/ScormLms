import { useEffect, useState } from "react";
import { Archive, Loader2, RefreshCw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { scormApi, type ScormPackage } from "@/services/api/scorm-api";
import { teacherPortalApi, type TeacherCourse } from "@/services/api/teacher-portal-api";

export function ScormPackageManager() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void teacherPortalApi.getCourses().then((items) => {
      setCourses(items);
      if (items[0]) setCourseId(items[0].id);
    }).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    const numericId = Number(courseId);
    if (!numericId) { setPackages([]); return; }
    setLoading(true);
    void scormApi.listPackages(numericId)
      .then(setPackages)
      .catch((cause) => toast({ variant: "destructive", title: "SCORM paketlar yuklanmadi", description: cause instanceof Error ? cause.message : undefined }))
      .finally(() => setLoading(false));
  }, [courseId, toast]);

  const upload = async () => {
    const numericId = Number(courseId);
    if (!numericId || !file) {
      toast({ variant: "destructive", title: "Kurs va SCORM ZIP faylini tanlang" });
      return;
    }
    setUploading(true);
    try {
      const imported = await scormApi.importPackage(numericId, file);
      setPackages((items) => [imported, ...items]);
      setFile(null);
      const input = document.getElementById("scorm-package-file") as HTMLInputElement | null;
      if (input) input.value = "";
      toast({ title: "SCORM paket import qilindi", description: `${imported.title} · ${imported.version === "SCORM_2004" ? "SCORM 2004" : "SCORM 1.2"}` });
    } catch (cause) {
      toast({ variant: "destructive", title: "Import amalga oshmadi", description: cause instanceof Error ? cause.message : undefined });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Archive className="h-5 w-5 text-blue-600" />SCORM paketlarni boshqarish</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-[1fr_1.4fr_auto] gap-3 items-end">
          <div className="space-y-1.5"><Label>Kurs</Label><Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Kursni tanlang" /></SelectTrigger><SelectContent>{courses.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>SCORM ZIP (maks. 200 MB)</Label><Input id="scorm-package-file" type="file" accept=".zip,application/zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
          <Button onClick={() => void upload()} disabled={uploading || !courseId || !file} className="gap-2">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Import</Button>
        </div>
        <div className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground flex gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Paketlar yuklanmoqda...</p>}
          {!loading && courseId && packages.length === 0 && <p className="text-sm text-muted-foreground">Bu kursga hali SCORM paket biriktirilmagan.</p>}
          {packages.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-muted-foreground">{item.entryPoint} · {item.importedBy}</p></div><div className="flex gap-2"><Badge variant="secondary">{item.version === "SCORM_2004" ? "SCORM 2004" : "SCORM 1.2"}</Badge><Badge className="bg-green-100 text-green-800">{item.status}</Badge></div></div>)}
        </div>
      </CardContent>
    </Card>
  );
}
