import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { listSubjects } from "@/lib/academic-api";
import { hasAuthority } from "@/lib/rbac-api";
import { syllabusApi, type SubjectSyllabus, type SyllabusLanguage } from "@/services/api/syllabus-api";

interface Form { subjectId: number; name: string; language: SyllabusLanguage; shortDescription: string; requirements: string; fullDescription: string; active: boolean }

export function AdminSyllabi() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const data = useCrudData<SubjectSyllabus>(["syllabi"], () => syllabusApi.list());
  const subjects = useQuery({ queryKey: ["subjects", "syllabus-options"], queryFn: () => listSubjects() });
  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">O'quv dasturi</h1><p className="text-sm text-muted-foreground">Fan, til, qisqa ta'rif, talablar va to'liq mazmun bo'yicha syllabus katalogi.</p></div>
    <CrudSection<SubjectSyllabus, Form>
      title="O'quv dasturlari" description="Tasdiqlangan fanlar uchun metodik dasturlar" searchPlaceholder="Nomi, fan yoki til..."
      items={data.items} loading={data.loading} error={data.error} onReload={data.reload} canWrite={canWrite}
      getId={(x) => x.id} getName={(x) => x.name} search={(x) => `${x.name} ${x.subjectName} ${x.subjectCode ?? ""} ${x.language}`}
      columns={[
        { header: "Holati", cell: (x) => <Badge variant={x.active ? "default" : "secondary"}>{x.active ? "Faol" : "Nofaol"}</Badge> },
        { header: "Nomi", cell: (x) => <span className="font-medium">{x.name}</span> },
        { header: "Fan", cell: (x) => `${x.subjectCode ?? "—"} · ${x.subjectName}` },
        { header: "Fan tili", cell: (x) => x.language },
      ]}
      blankForm={() => ({ subjectId: 0, name: "", language: "UZ", shortDescription: "", requirements: "", fullDescription: "", active: true })}
      toForm={(x) => ({ subjectId: x.subjectId, name: x.name, language: x.language, shortDescription: x.shortDescription, requirements: x.requirements ?? "", fullDescription: x.fullDescription, active: x.active })}
      validate={(f) => !f.subjectId ? "Fan tanlang" : f.name.trim().length < 3 ? "Nomi kamida 3 belgi" : f.shortDescription.trim().length < 3 ? "Qisqa ta'rif majburiy" : f.fullDescription.trim().length < 3 ? "To'liq ta'rif majburiy" : null}
      onCreate={(f) => syllabusApi.create({ ...f, name: f.name.trim(), shortDescription: f.shortDescription.trim(), requirements: f.requirements.trim() || null, fullDescription: f.fullDescription.trim() }).then(() => undefined)}
      onUpdate={(id, f) => syllabusApi.update(id, { ...f, name: f.name.trim(), shortDescription: f.shortDescription.trim(), requirements: f.requirements.trim() || null, fullDescription: f.fullDescription.trim() }).then(() => undefined)}
      onDelete={syllabusApi.delete}
      renderForm={(f, set) => <>
        <div className="space-y-1.5"><Label>Fan *</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.subjectId} onChange={(e) => set({ subjectId: Number(e.target.value) })}><option value={0}>Fan tanlang</option>{(subjects.data ?? []).filter(x => x.active).map(x => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></div>
        <div className="grid grid-cols-[1fr_160px] gap-3"><div className="space-y-1.5"><Label>Nomi *</Label><Input value={f.name} onChange={(e) => set({ name: e.target.value })} /></div><div className="space-y-1.5"><Label>Dastur tili *</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.language} onChange={(e) => set({ language: e.target.value as SyllabusLanguage })}><option value="UZ">O'zbekcha</option><option value="EN">English</option><option value="RU">Русский</option><option value="KAA">Qaraqalpaqsha</option><option value="UZ_CYRILLIC">Ўзбекча</option></select></div></div>
        <div className="space-y-1.5"><Label>Qisqa ta'rif *</Label><Textarea value={f.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Talablar</Label><Textarea value={f.requirements} onChange={(e) => set({ requirements: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>To'liq ta'rif *</Label><Textarea className="min-h-32" value={f.fullDescription} onChange={(e) => set({ fullDescription: e.target.value })} /></div>
        <div className="flex items-center gap-2"><Switch checked={f.active} onCheckedChange={(active) => set({ active })} /><Label>Faol</Label></div>
      </>}
    />
  </div>;
}
