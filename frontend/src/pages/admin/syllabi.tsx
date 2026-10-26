import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, ListOrdered, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { SyllabusWorkflow, syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { SyllabusTopicsDialog } from "@/components/admin/syllabus-topics";
import { WorkProgramForm } from "@/components/admin/work-program-form";
import { useAuth } from "@/contexts/auth-context";
import { listSubjects } from "@/lib/academic-api";
import { hasAuthority } from "@/lib/rbac-api";
import { formatTypeHours, syllabusLanguages, syllabusTypeHours } from "@/lib/syllabus";
import { modelProgramApi, type ModelProgram, type ModelProgramInput } from "@/services/api/model-program-api";
import { syllabusApi, type SubjectSyllabus, type SyllabusLanguage } from "@/services/api/syllabus-api";

interface ModelForm { subjectId: number; language: SyllabusLanguage; shortDescription: string; requirements: string; fullDescription: string; active: boolean }

const toInput = (f: ModelForm): ModelProgramInput => ({
  ...f, shortDescription: f.shortDescription.trim(), requirements: f.requirements.trim() || null, fullDescription: f.fullDescription.trim(),
});
const languageLabel = (language: SyllabusLanguage) => syllabusLanguages.find((l) => l.value === language)?.label ?? language;
const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

/**
 * O'quv dasturi bo'limi, ikki daraja:
 * 1) O'quv dasturi (namunaviy) — fan, til va ta'riflar; bir fan va til uchun bitta.
 * 2) Fan dasturi (ishchi dastur / sillabus) — o'quv dasturidan o'quv yili va semestr uchun: mavzular, soatlar va kurs.
 */
export function AdminSyllabi() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const subjects = useQuery({ queryKey: ["subjects", "syllabus-options"], queryFn: () => listSubjects() });
  const models = useCrudData<ModelProgram>(["model-programs"], () => modelProgramApi.list());
  const programs = useCrudData<SubjectSyllabus>(["syllabi"], () => syllabusApi.list());
  const [modelId, setModelId] = useState<number | null>(null);
  const [formModel, setFormModel] = useState<ModelProgram | null>(null);
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [topicsItem, setTopicsItem] = useState<SubjectSyllabus | null>(null);
  const model = models.items.find((m) => m.id === modelId);
  const workPrograms = model ? programs.items.filter((p) => p.modelProgramId === model.id) : [];
  const workflowItem = programs.items.find((p) => p.id === workflowId);
  const reloadAll = () => { void programs.reload(); void models.reload(); };

  return <div className="space-y-6 p-3 sm:p-6">
    {subjects.isLoading && <p>Fanlar yuklanmoqda...</p>}
    {subjects.isError && <div role="alert">Fanlar yuklanmadi. <Button variant="outline" onClick={() => subjects.refetch()}>Fanlarni qayta yuklash</Button></div>}
    {workflowItem && <SyllabusWorkflow item={workflowItem} canWrite={canWrite} reload={programs.reload} close={() => setWorkflowId(null)} />}
    {topicsItem && <SyllabusTopicsDialog key={topicsItem.id} item={topicsItem} canWrite={canWrite}
      credits={models.items.find((m) => m.id === topicsItem.modelProgramId)?.subjectCredits}
      onSaved={reloadAll} onClose={() => setTopicsItem(null)} />}
    {formModel && <WorkProgramForm model={formModel} onCreated={() => { reloadAll(); setModelId(formModel.id); }} onClose={() => setFormModel(null)} />}

    <div>
      <h1 className="text-2xl font-bold">O'quv dasturi</h1>
      <p className="text-sm text-muted-foreground">
        Avval fan bo'yicha o'quv dasturi (namunaviy) yaratiladi, so'ng undan o'quv yili va semestr uchun fan dasturi —
        mavzular (nazariy, amaliy, laboratoriya, seminar), soatlar va kurs bilan.
      </p>
    </div>

    <CrudSection<ModelProgram, ModelForm>
      title="O'quv dasturlari" description="Namunaviy dastur: fan bo'yicha umumiy, bir fan va til uchun bitta" searchPlaceholder="Fan nomi yoki kodi..."
      items={models.items} loading={models.loading} error={models.error} onReload={models.reload} canWrite={canWrite}
      allowCreate={subjects.isSuccess}
      canDeleteItem={(m) => m.workProgramCount === 0}
      dialogClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      getId={(m) => m.id} getName={(m) => m.name} search={(m) => `${m.name} ${m.subjectCode ?? ""} ${m.language}`}
      columns={[
        { header: "Fan", cell: (m) => <div><div className="font-medium">{m.subjectName}</div><div className="text-xs text-muted-foreground">{m.subjectCode ?? "—"}{m.subjectCredits ? ` · ${m.subjectCredits} kredit` : ""}</div></div> },
        { header: "Til", cell: (m) => languageLabel(m.language) },
        { header: "Holati", cell: (m) => <Badge variant={m.active ? "default" : "secondary"}>{m.active ? "Faol" : "Nofaol"}</Badge> },
        { header: "Fan dasturlari", cell: (m) => <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={m.id === modelId ? "default" : "outline"} className="h-8" onClick={() => setModelId(m.id === modelId ? null : m.id)}>
            <FileText className="mr-1 h-3 w-3" />{m.workProgramCount} ta
          </Button>
          {canWrite && m.active && <Button size="sm" variant="secondary" className="h-8" onClick={() => setFormModel(m)}>
            <Plus className="mr-1 h-3 w-3" />Fan dasturi
          </Button>}
        </div> },
      ]}
      blankForm={() => ({ subjectId: 0, language: "UZ", shortDescription: "", requirements: "", fullDescription: "", active: true })}
      toForm={(m) => ({ subjectId: m.subjectId, language: m.language, shortDescription: m.shortDescription, requirements: m.requirements ?? "", fullDescription: m.fullDescription, active: m.active })}
      validate={(f) => !f.subjectId ? "Fan tanlang" : f.shortDescription.trim().length < 3 ? "Qisqa ta'rif majburiy" : f.fullDescription.trim().length < 3 ? "To'liq ta'rif majburiy" : null}
      onCreate={(f) => modelProgramApi.create(toInput(f)).then(() => undefined)}
      onUpdate={(id, f) => modelProgramApi.update(id, toInput(f)).then(() => undefined)}
      onDelete={modelProgramApi.delete}
      renderForm={(f, set, { isEdit }) => <>
        <div className="grid grid-cols-[1fr_180px] gap-3">
          <div className="space-y-1.5"><Label htmlFor="model-subject">Fan *</Label><select id="model-subject" className={selectClass} value={f.subjectId} onChange={(e) => set({ subjectId: Number(e.target.value) })}><option value={0}>Fan tanlang</option>{(subjects.data ?? []).filter((x) => x.active || x.id === f.subjectId).map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}{x.credits ? ` · ${x.credits} kredit` : ""}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor="model-language">Dastur tili *</Label><select id="model-language" className={selectClass} value={f.language} onChange={(e) => set({ language: e.target.value as SyllabusLanguage })}>{syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="model-short">Qisqa ta'rif *</Label><Textarea id="model-short" value={f.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="model-req">Talablar</Label><Textarea id="model-req" value={f.requirements} onChange={(e) => set({ requirements: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="model-full">To'liq ta'rif *</Label><Textarea id="model-full" className="min-h-24" value={f.fullDescription} onChange={(e) => set({ fullDescription: e.target.value })} /></div>
        <div className="flex items-center gap-2"><Switch checked={f.active} onCheckedChange={(active) => set({ active })} /><Label>Faol</Label></div>
        {!isEdit && <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">Saqlangandan keyin ro'yxatdagi "Fan dasturi" tugmasi orqali o'quv yili va semestr uchun fan dasturi (mavzular, soatlar va kurs) yaratiladi.</p>}
      </>}
    />

    {model ? (
      <section className="space-y-3" aria-label="Fan dasturlari">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Fan dasturlari: </span>
            <b>{model.subjectCode ? `${model.subjectCode} · ` : ""}{model.subjectName}</b>
            <span className="text-muted-foreground"> · {languageLabel(model.language)}</span>
          </div>
          <div className="flex gap-2">
            {canWrite && model.active && <Button size="sm" onClick={() => setFormModel(model)}><Plus className="mr-1 h-4 w-4" />Fan dasturi qo'shish</Button>}
            <Button size="sm" variant="ghost" onClick={() => setModelId(null)} aria-label="Yopish"><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <CrudSection<SubjectSyllabus, Record<string, never>>
          title="Fan dasturlari" description="O'quv yili va semestr bo'yicha ishchi dasturlar" searchPlaceholder="O'quv yili yoki semestr..."
          items={workPrograms} loading={programs.loading} error={programs.error} onReload={programs.reload} canWrite={canWrite}
          allowCreate={false}
          canEditItem={() => false}
          canDeleteItem={(x) => x.status === "DRAFT" && x.revisionNumber === 1}
          getId={(x) => x.id} getName={(x) => x.name} search={(x) => `${x.name} ${x.academicYear ?? ""} ${x.semester ?? ""}`}
          columns={[
            { header: "Davr", cell: (x) => <span className="font-medium">{x.academicYear ?? "—"} · {x.semester ? `${x.semester}-semestr` : "—"}</span> },
            { header: "Versiya", cell: (x) => `${x.revisionNumber} · ${syllabusStatuses[x.status]}` },
            { header: "Mavzular", cell: (x) => {
              const count = x.topics?.length ?? 0;
              return <Button size="sm" variant={count ? "outline" : "secondary"} className="h-8" onClick={() => setTopicsItem(x)}>
                <ListOrdered className="mr-1 h-3 w-3" />
                {count ? `${count} ta · ${formatTypeHours(syllabusTypeHours(x))} soat` : x.status === "DRAFT" && canWrite ? "Mavzu qo'shish" : "Mavzular yo'q"}
              </Button>;
            } },
            { header: "Ko‘rish", cell: (x) => <Button size="sm" variant="outline" onClick={() => setWorkflowId(x.id)}>Mazmun va tarix</Button> },
          ]}
          blankForm={() => ({})}
          toForm={() => ({})}
          onCreate={() => Promise.resolve()}
          onUpdate={() => Promise.resolve()}
          onDelete={syllabusApi.delete}
          renderForm={() => null}
        />
      </section>
    ) : (
      <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        Fan dasturlarini ko'rish uchun o'quv dasturi qatoridagi "Fan dasturlari" tugmasini bosing.
      </p>
    )}
  </div>;
}
