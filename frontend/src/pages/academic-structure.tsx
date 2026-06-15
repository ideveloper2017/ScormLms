import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  DepartmentRecord, FacultyRecord, ProgramRecord,
  createDepartment, createFaculty, createProgram,
  deleteDepartment, deleteFaculty, deleteProgram,
  listDepartments, listFaculties, listPrograms,
  updateDepartment, updateFaculty, updateProgram,
} from "@/lib/academic-api";

const DEGREES = [
  { value: "BACHELOR", label: "Bakalavr" },
  { value: "MASTER", label: "Magistr" },
  { value: "PHD", label: "Doktorantura" },
];

interface FacultyForm { name: string; code: string; active: boolean }
interface DepartmentForm { name: string; code: string; facultyId: number | null; active: boolean }
interface ProgramForm { name: string; code: string; degreeLevel: string; departmentId: number | null; active: boolean }

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "default" : "secondary"}>{active ? "Faol" : "Nofaol"}</Badge>;
}

export function AcademicStructure({ defaultTab = "faculties" }: { defaultTab?: string }) {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");

  const faculties = useCrudData<FacultyRecord>(["faculties"], listFaculties);
  const departments = useCrudData<DepartmentRecord>(["departments"], listDepartments);
  const programs = useCrudData<ProgramRecord>(["programs"], listPrograms);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Akademik tuzilma</h1>
        <p className="text-sm text-muted-foreground">Fakultet → Kafedra → Yo'nalish ierarxiyasi</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="faculties">Fakultetlar</TabsTrigger>
          <TabsTrigger value="departments">Kafedralar</TabsTrigger>
          <TabsTrigger value="programs">Yo'nalishlar</TabsTrigger>
        </TabsList>

        {/* ── Fakultetlar ─────────────────────────────────────────── */}
        <TabsContent value="faculties" className="mt-4">
          <CrudSection<FacultyRecord, FacultyForm>
            title="Fakultetlar"
            items={faculties.items}
            loading={faculties.loading}
            error={faculties.error}
            onReload={faculties.reload}
            canWrite={canWrite}
            getId={(f) => f.id}
            getName={(f) => f.name}
            search={(f) => `${f.name} ${f.code ?? ""}`}
            columns={[
              { header: "Nomi", cell: (f) => <span className="font-medium">{f.name}</span> },
              { header: "Kodi", cell: (f) => f.code ?? "—" },
              { header: "Holat", cell: (f) => <ActiveBadge active={f.active} /> },
            ]}
            blankForm={() => ({ name: "", code: "", active: true })}
            toForm={(f) => ({ name: f.name, code: f.code ?? "", active: f.active })}
            validate={(f) => (f.name.trim() ? null : "Nomi majburiy")}
            onCreate={(f) => createFaculty({ name: f.name.trim(), code: f.code.trim() || null, active: f.active }).then(() => undefined)}
            onUpdate={(id, f) => updateFaculty(id, { name: f.name.trim(), code: f.code.trim() || null, active: f.active }).then(() => undefined)}
            onDelete={(id) => deleteFaculty(id)}
            renderForm={(form, set) => (
              <>
                <div className="space-y-1.5">
                  <Label>Nomi <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kodi</Label>
                  <Input value={form.code} onChange={(e) => set({ code: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} />
                  <Label>Faol</Label>
                </div>
              </>
            )}
          />
        </TabsContent>

        {/* ── Kafedralar ──────────────────────────────────────────── */}
        <TabsContent value="departments" className="mt-4">
          <CrudSection<DepartmentRecord, DepartmentForm>
            title="Kafedralar"
            items={departments.items}
            loading={departments.loading}
            error={departments.error}
            onReload={departments.reload}
            canWrite={canWrite}
            getId={(d) => d.id}
            getName={(d) => d.name}
            search={(d) => `${d.name} ${d.code ?? ""} ${d.facultyName ?? ""}`}
            columns={[
              { header: "Nomi", cell: (d) => <span className="font-medium">{d.name}</span> },
              { header: "Kodi", cell: (d) => d.code ?? "—" },
              { header: "Fakultet", cell: (d) => d.facultyName ?? "—" },
              { header: "Holat", cell: (d) => <ActiveBadge active={d.active} /> },
            ]}
            blankForm={() => ({ name: "", code: "", facultyId: null, active: true })}
            toForm={(d) => ({ name: d.name, code: d.code ?? "", facultyId: d.facultyId ?? null, active: d.active })}
            validate={(f) => (f.name.trim() ? null : "Nomi majburiy")}
            onCreate={(f) => createDepartment({ name: f.name.trim(), code: f.code.trim() || null, facultyId: f.facultyId, active: f.active }).then(() => undefined)}
            onUpdate={(id, f) => updateDepartment(id, { name: f.name.trim(), code: f.code.trim() || null, facultyId: f.facultyId, active: f.active }).then(() => undefined)}
            onDelete={(id) => deleteDepartment(id)}
            renderForm={(form, set) => (
              <>
                <div className="space-y-1.5">
                  <Label>Nomi <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kodi</Label>
                  <Input value={form.code} onChange={(e) => set({ code: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fakultet</Label>
                  <Select
                    value={form.facultyId != null ? String(form.facultyId) : "none"}
                    onValueChange={(v) => set({ facultyId: v === "none" ? null : Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Tanlanmagan —</SelectItem>
                      {faculties.items.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} />
                  <Label>Faol</Label>
                </div>
              </>
            )}
          />
        </TabsContent>

        {/* ── Yo'nalishlar ────────────────────────────────────────── */}
        <TabsContent value="programs" className="mt-4">
          <CrudSection<ProgramRecord, ProgramForm>
            title="Yo'nalishlar"
            items={programs.items}
            loading={programs.loading}
            error={programs.error}
            onReload={programs.reload}
            canWrite={canWrite}
            getId={(p) => p.id}
            getName={(p) => p.name}
            search={(p) => `${p.name} ${p.code ?? ""} ${p.departmentName ?? ""}`}
            columns={[
              { header: "Nomi", cell: (p) => <span className="font-medium">{p.name}</span> },
              { header: "Kodi", cell: (p) => p.code ?? "—" },
              { header: "Daraja", cell: (p) => DEGREES.find((d) => d.value === p.degreeLevel)?.label ?? p.degreeLevel ?? "—" },
              { header: "Kafedra", cell: (p) => p.departmentName ?? "—" },
              { header: "Holat", cell: (p) => <ActiveBadge active={p.active} /> },
            ]}
            blankForm={() => ({ name: "", code: "", degreeLevel: "BACHELOR", departmentId: null, active: true })}
            toForm={(p) => ({
              name: p.name, code: p.code ?? "", degreeLevel: p.degreeLevel ?? "BACHELOR",
              departmentId: p.departmentId ?? null, active: p.active,
            })}
            validate={(f) => (f.name.trim() ? null : "Nomi majburiy")}
            onCreate={(f) => createProgram({ name: f.name.trim(), code: f.code.trim() || null, degreeLevel: f.degreeLevel, departmentId: f.departmentId, active: f.active }).then(() => undefined)}
            onUpdate={(id, f) => updateProgram(id, { name: f.name.trim(), code: f.code.trim() || null, degreeLevel: f.degreeLevel, departmentId: f.departmentId, active: f.active }).then(() => undefined)}
            onDelete={(id) => deleteProgram(id)}
            renderForm={(form, set) => (
              <>
                <div className="space-y-1.5">
                  <Label>Nomi <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Kodi</Label>
                    <Input value={form.code} onChange={(e) => set({ code: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Daraja</Label>
                    <Select value={form.degreeLevel} onValueChange={(v) => set({ degreeLevel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEGREES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Kafedra</Label>
                  <Select
                    value={form.departmentId != null ? String(form.departmentId) : "none"}
                    onValueChange={(v) => set({ departmentId: v === "none" ? null : Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Tanlanmagan —</SelectItem>
                      {departments.items.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} />
                  <Label>Faol</Label>
                </div>
              </>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
