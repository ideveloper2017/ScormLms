import { useState, type ElementType, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, File, FileText, Link as LinkIcon, Loader2, Plus, Trash2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScormPackageManager } from "@/components/scorm/package-manager";
import { LazyRichTextEditor } from "@/components/editor/lazy-rich-text-editor";
import { isRichTextEmpty, richTextToPlainText } from "@/components/editor/rich-text-utils";
import { useToast } from "@/hooks/use-toast";
import { teacherPortalApi, type CourseContent, type SubjectMaterial } from "@/services/api/teacher-portal-api";

type MaterialType = "VIDEO" | "DOCUMENT" | "LINK" | "FILE" | "TEXT";

const TYPE_META: Record<CourseContent["contentType"], { label: string; icon: ElementType }> = {
  video: { label: "Video", icon: Video },
  document: { label: "Hujjat", icon: FileText },
  file: { label: "Fayl", icon: File },
  link: { label: "Havola", icon: LinkIcon },
  text: { label: "Matn", icon: FileText },
};

export function TeacherContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<MaterialType>("TEXT");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const subjectsQuery = useQuery({
    queryKey: ["teacher", "subject-material-subjects"],
    queryFn: teacherPortalApi.getSubjectMaterialSubjects,
  });
  const materialsQuery = useQuery({
    queryKey: ["teacher", "subject-materials"],
    queryFn: teacherPortalApi.getSubjectMaterials,
  });
  const subjects = subjectsQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const selectedSubjectId = Number(subjectId);
      const asset = file ? await teacherPortalApi.uploadSubjectMaterialAsset(selectedSubjectId, file) : undefined;
      return teacherPortalApi.createSubjectMaterial({
        subjectId: selectedSubjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        contentType: type,
        contentBody: type === "TEXT" ? body.trim() : undefined,
        contentUrl: type === "TEXT" || asset ? undefined : url.trim() || undefined,
        assetId: asset?.id,
        languageCode: "uz",
        contentVersion: "1.0",
      });
    },
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setBody("");
      setUrl("");
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["teacher", "subject-materials"] });
      toast({ title: "Material fan kutubxonasiga qo'shildi" });
    },
    onError: (cause: Error) => toast({ variant: "destructive", title: "Material saqlanmadi", description: cause.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: teacherPortalApi.deleteSubjectMaterial,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teacher", "subject-materials"] });
      toast({ title: "Material o'chirildi" });
    },
    onError: (cause: Error) => toast({ variant: "destructive", title: "Material o'chirilmadi", description: cause.message }),
  });

  function save() {
    if (!subjectId || title.trim().length < 2) return toast({ variant: "destructive", title: "Fan va material nomini kiriting" });
    if (type === "TEXT" && isRichTextEmpty(body)) return toast({ variant: "destructive", title: "Dars matnini kiriting" });
    if (type === "LINK" && !url.trim()) return toast({ variant: "destructive", title: "Havolani kiriting" });
    if (["VIDEO", "DOCUMENT", "FILE"].includes(type) && !file && !url.trim()) {
      return toast({ variant: "destructive", title: "Fayl tanlang yoki URL kiriting" });
    }
    saveMutation.mutate();
  }

  const materials = materialsQuery.data ?? [];
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Fan materiallari</h1>
        <p className="text-muted-foreground">Materialni bir marta fanga kiriting, keyin kerakli kurs moduliga biriktiring.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yangi material</CardTitle>
          <CardDescription>Muallif, manba va boshlang'ich versiya avtomatik belgilanadi.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Fan *">
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Biriktirilgan fanni tanlang" /></SelectTrigger>
              <SelectContent>{subjects.map(subject => <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Material nomi *"><Input value={title} onChange={event => setTitle(event.target.value)} /></Field>
          <Field label="Turi *">
            <Select value={type} onValueChange={value => { setType(value as MaterialType); setFile(null); setUrl(""); setBody(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">Matnli dars</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="DOCUMENT">Hujjat</SelectItem>
                <SelectItem value="LINK">Havola</SelectItem>
                <SelectItem value="FILE">Boshqa fayl</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {type === "TEXT" ? (
            <Field label="Dars matni *" className="md:col-span-2"><LazyRichTextEditor value={body} onChange={setBody} placeholder="Dars mazmunini yozing yoki MathType orqali formula kiriting..." /></Field>
          ) : type === "LINK" ? (
            <Field label="Havola *"><Input placeholder="https://..." value={url} onChange={event => setUrl(event.target.value)} /></Field>
          ) : (
            <>
              <Field label="Fayl"><Input type="file" onChange={event => setFile(event.target.files?.[0] ?? null)} /></Field>
              <Field label="Yoki tashqi URL"><Input disabled={Boolean(file)} placeholder="https://..." value={url} onChange={event => setUrl(event.target.value)} /></Field>
            </>
          )}
          <Field label="Qisqa tavsif" className="md:col-span-2"><Textarea value={description} onChange={event => setDescription(event.target.value)} /></Field>
          <div className="md:col-span-2 flex justify-end">
            <Button className="gap-2" onClick={save} disabled={saveMutation.isPending || subjects.length === 0}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Saqlash
            </Button>
          </div>
          {!subjectsQuery.isLoading && subjects.length === 0 && <p className="md:col-span-2 text-sm text-destructive">Sizga fan biriktirilmagan. Administratorga murojaat qiling.</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Mening materiallarim</h2>
          <p className="text-sm text-muted-foreground">Kurs ichidagi “Kontent” bo'limidan modulga biriktiriladi.</p>
        </div>
        {materialsQuery.isLoading && <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
        {!materialsQuery.isLoading && materials.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Hozircha fan materiali yo'q</CardContent></Card>}
        {materials.map(material => <MaterialCard key={material.id} material={material} deleting={deleteMutation.isPending} onDelete={() => deleteMutation.mutate(material.id)} />)}
      </div>

      <ScormPackageManager />
    </div>
  );
}

function MaterialCard({ material, deleting, onDelete }: { material: SubjectMaterial; deleting: boolean; onDelete: () => void }) {
  const meta = TYPE_META[material.contentType];
  const Icon = meta.icon;
  return (
    <Card><CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{material.title}</p>
        <p className="text-xs text-muted-foreground truncate">{material.subjectName} · {material.authorName} · v{material.contentVersion}</p>
        {material.asset && <p className="text-xs text-muted-foreground truncate">{material.asset.originalFileName} · {formatBytes(material.asset.sizeBytes)}</p>}
        {material.contentBody && <p className="mt-1 text-sm line-clamp-2">{richTextToPlainText(material.contentBody)}</p>}
      </div>
      <Badge variant="outline">{meta.label}</Badge>
      {material.contentUrl && <Button variant="outline" size="icon" asChild><a href={material.contentUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
      <Button variant="ghost" size="icon" className="text-destructive" disabled={deleting} onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </CardContent></Card>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label>{label}</Label>{children}</div>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
