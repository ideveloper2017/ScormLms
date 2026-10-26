import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ListOrdered, Plus, X } from "lucide-react";
import { SyllabusCourseWizard } from "@/components/admin/syllabus-course-wizard";
import { Button } from "@/components/ui/button";
import { SyllabusWorkflow, syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { SyllabusTopicsDialog } from "@/components/admin/syllabus-topics";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { listSubjects } from "@/lib/academic-api";
import { hasAuthority } from "@/lib/rbac-api";
import { syllabusApi, type SubjectSyllabus, type SubjectSyllabusInput, type SyllabusLanguage } from "@/services/api/syllabus-api";

interface Form { subjectId: number; language: SyllabusLanguage; shortDescription: string; requirements: string; fullDescription: string; active: boolean }

// Nom yuborilmaydi — dastur fan bilan aniqlanadi (backend fan nomini oladi).
// Mavzular ham yuborilmaydi — ular alohida "Mavzular" oynasida saqlanadi (topics=null — o'zgarmaydi)
const toInput = (f: Form): SubjectSyllabusInput => ({
  ...f, shortDescription: f.shortDescription.trim(), requirements: f.requirements.trim() || null, fullDescription: f.fullDescription.trim(),
});

interface Props {
  /** Berilsa, faqat shu fan dasturlari ko'rsatiladi va yangi dastur shu fanga yaratiladi. */
  subjectId?: number | null;
  onClearSubject?: () => void;
  /** Boshqa sahifa ichida (tab sifatida) ko'rsatilganda sarlavha yashiriladi. */
  embedded?: boolean;
}

export function AdminSyllabi({ subjectId, onClearSubject, embedded = false }: Props = {}) {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const data = useCrudData<SubjectSyllabus>(["syllabi"], () => syllabusApi.list());
  const subjects = useQuery({ queryKey: ["subjects", "syllabus-options"], queryFn: () => listSubjects() });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [topicsItem, setTopicsItem] = useState<SubjectSyllabus | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const selected = data.items.find(item => item.id === selectedId);
  const items = subjectId ? data.items.filter(item => item.subjectId === subjectId) : data.items;
  const filterSubject = subjectId ? (subjects.data ?? []).find(s => s.id === subjectId) : undefined;
  return <div className={embedded ? "space-y-4" : "space-y-6 p-3 sm:p-6"}>
    {subjects.isLoading && <p>Fanlar yuklanmoqda...</p>}
    {subjects.isError && <div role="alert">Fanlar yuklanmadi. <Button variant="outline" onClick={() => subjects.refetch()}>Fanlarni qayta yuklash</Button></div>}
    {selected && <SyllabusWorkflow item={selected} canWrite={canWrite} reload={data.reload} close={() => setSelectedId(null)} />}
    {topicsItem && <SyllabusTopicsDialog key={topicsItem.id} item={topicsItem} canWrite={canWrite} onSaved={() => { void data.reload(); }} onClose={() => setTopicsItem(null)} />}
    {wizardOpen && subjects.data && <SyllabusCourseWizard subjects={subjects.data} defaultSubjectId={subjectId}
      onCreated={() => { void data.reload(); }} onClose={() => setWizardOpen(false)} />}
    <div className="flex flex-wrap items-start justify-between gap-3">
      {!embedded ? <div><h1 className="text-2xl font-bold">O'quv dasturi</h1><p className="text-sm text-muted-foreground">Fan dasturi, uning nazariy/amaliy mavzulari va shu dastur asosidagi kurs bitta oynada yaratiladi.</p></div> : <span />}
      {canWrite && <Button onClick={() => setWizardOpen(true)} disabled={!subjects.isSuccess}>
        <Plus className="mr-1 h-4 w-4" />Yangi fan dasturi va kurs
      </Button>}
    </div>
    {subjectId && <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <span>Fan: <b>{filterSubject ? `${filterSubject.code ?? "—"} · ${filterSubject.name}` : `#${subjectId}`}</b></span>
      {onClearSubject && <Button size="sm" variant="ghost" className="h-7" onClick={onClearSubject}><X className="mr-1 h-3 w-3" />Barcha fanlar</Button>}
    </div>}
    <CrudSection<SubjectSyllabus, Form>
      title="O'quv dasturlari" description="Fan dasturlari: mavzular nazariy va amaliy mashg'ulotlarga bo'lingan" searchPlaceholder="Nomi, fan yoki til..."
      items={items} loading={data.loading} error={data.error} onReload={data.reload} canWrite={canWrite}
      // Yaratish "Fan dasturi va kurs" oynasi orqali; bu forma faqat tahrirlash uchun
      allowCreate={false}
      canEditItem={item => item.status === "DRAFT" && subjects.isSuccess}
      canDeleteItem={item => item.status === "DRAFT" && item.revisionNumber === 1}
      // sm: prefiksi — dialogning bazaviy sm:max-w-md klassini almashtirish uchun
      dialogClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      getId={(x) => x.id} getName={(x) => x.name} search={(x) => `${x.name} ${x.subjectName} ${x.subjectCode ?? ""} ${x.language}`}
      columns={[
        { header: "Versiya", cell: x => `${x.revisionNumber} · ${syllabusStatuses[x.status]}` },
        { header: "Ko‘rish", cell: x => <Button size="sm" variant="outline" onClick={() => setSelectedId(x.id)}>Mazmun va tarix</Button> },
        { header: "Holati", cell: (x) => <Badge variant={x.active ? "default" : "secondary"}>{x.active ? "Faol" : "Nofaol"}</Badge> },
        { header: "Nomi", cell: (x) => <span className="font-medium">{x.name}</span> },
        { header: "Fan", cell: (x) => `${x.subjectCode ?? "—"} · ${x.subjectName}` },
        { header: "Mavzular", cell: (x) => {
          const count = x.topics?.length ?? 0;
          return <Button size="sm" variant={count ? "outline" : "secondary"} className="h-8" onClick={() => setTopicsItem(x)}>
            <ListOrdered className="mr-1 h-3 w-3" />
            {count ? `${count} ta · N ${x.theoreticalHours ?? 0} / A ${x.practicalHours ?? 0} soat` : x.status === "DRAFT" && canWrite ? "Mavzu qo'shish" : "Mavzular yo'q"}
          </Button>;
        } },
        { header: "Fan tili", cell: (x) => x.language },
      ]}
      blankForm={() => ({ subjectId: subjectId ?? 0, language: "UZ", shortDescription: "", requirements: "", fullDescription: "", active: true })}
      toForm={(x) => ({ subjectId: x.subjectId, language: x.language, shortDescription: x.shortDescription, requirements: x.requirements ?? "", fullDescription: x.fullDescription, active: x.active })}
      validate={(f) => !f.subjectId ? "Fan tanlang" : f.shortDescription.trim().length < 3 ? "Qisqa ta'rif majburiy" : f.fullDescription.trim().length < 3 ? "To'liq ta'rif majburiy" : null}
      onCreate={(f) => syllabusApi.create(toInput(f)).then(() => undefined)}
      onUpdate={(id, f) => syllabusApi.update(id, toInput(f)).then(() => undefined)}
      onDelete={syllabusApi.delete}
      renderForm={(f, set) => <>
        <div className="grid grid-cols-[1fr_180px] gap-3">
          <div className="space-y-1.5"><Label>Fan *</Label><select aria-label="Fan" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.subjectId} onChange={(e) => set({ subjectId: Number(e.target.value) })}><option value={0}>Fan tanlang</option>{(subjects.data ?? []).filter(x => x.active || x.id === f.subjectId).map(x => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></div>
          <div className="space-y-1.5"><Label>Dastur tili *</Label><select aria-label="Dastur tili" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.language} onChange={(e) => set({ language: e.target.value as SyllabusLanguage })}><option value="UZ">O'zbekcha</option><option value="EN">English</option><option value="RU">Русский</option><option value="KAA">Qaraqalpaqsha</option><option value="UZ_CYRILLIC">Ўзбекча</option></select></div>
        </div>
        <div className="space-y-1.5"><Label>Qisqa ta'rif *</Label><Textarea value={f.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Talablar</Label><Textarea value={f.requirements} onChange={(e) => set({ requirements: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>To'liq ta'rif *</Label><Textarea className="min-h-24" value={f.fullDescription} onChange={(e) => set({ fullDescription: e.target.value })} /></div>
        <div className="flex items-center gap-2"><Switch checked={f.active} onCheckedChange={(active) => set({ active })} /><Label>Faol</Label></div>
      </>}
    />
  </div>;
}
