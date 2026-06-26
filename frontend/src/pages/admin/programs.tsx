import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FolderTree } from "lucide-react";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  type ProgramRecord, type DepartmentRecord,
  createProgram, deleteProgram, listPrograms, updateProgram,
  listDepartments,
} from "@/lib/academic-api";

interface ProgramForm {
  name: string;
  code: string;
  degreeLevel: string;
  departmentId: number | null;
  active: boolean;
}

const DEGREES = [
  { value: "BACHELOR", label: "Bakalavr" },
  { value: "MASTER",   label: "Magistr"  },
  { value: "PHD",      label: "Doktorantura" },
];

const DEGREE_COLORS: Record<string, string> = {
  BACHELOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  MASTER:   "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  PHD:      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Faol" : "Nofaol"}
    </Badge>
  );
}

function DegreeBadge({ level }: { level: string | null | undefined }) {
  const entry = DEGREES.find((d) => d.value === level);
  const label = entry?.label ?? level ?? "—";
  const cls   = level ? (DEGREE_COLORS[level] ?? "") : "";
  return <Badge className={`text-xs ${cls}`}>{label}</Badge>;
}

export function AdminPrograms() {
  const { user } = useAuth();
  const canWrite  = hasAuthority(user, "ACADEMIC_WRITE");
  const programs    = useCrudData<ProgramRecord>(["programs"], listPrograms);
  const departments = useCrudData<DepartmentRecord>(["departments"], listDepartments);

  const byDegree = DEGREES.map((d) => ({
    ...d,
    count: programs.items.filter((p) => p.degreeLevel === d.value).length,
  }));

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
            <FolderTree className="h-3.5 w-3.5" />
            <span className="text-xs">Akademik tuzilma</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Yo'nalishlar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Ta'lim yo'nalishlari va dasturlarini boshqaring
          </p>
        </div>

        {!programs.loading && programs.items.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary" className="text-xs">
              Jami: {programs.items.length}
            </Badge>
            {byDegree.filter((d) => d.count > 0).map((d) => (
              <Badge key={d.value} className={`text-xs ${DEGREE_COLORS[d.value] ?? ""}`}>
                {d.label}: {d.count}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* CRUD table */}
      <CrudSection<ProgramRecord, ProgramForm>
        title="Yo'nalishlar"
        description="Ta'lim yo'nalishi qo'shish, tahrirlash va o'chirish"
        items={programs.items}
        loading={programs.loading}
        error={programs.error}
        onReload={programs.reload}
        canWrite={canWrite}
        getId={(p) => p.id}
        getName={(p) => p.name}
        search={(p) => `${p.name} ${p.code ?? ""} ${p.departmentName ?? ""}`}
        searchPlaceholder="Yo'nalish nomi, kodi yoki kafedra..."
        columns={[
          { header: "Nomi",    cell: (p) => <span className="font-medium">{p.name}</span> },
          { header: "Kodi",    cell: (p) => p.code ?? "—" },
          { header: "Daraja",  cell: (p) => <DegreeBadge level={p.degreeLevel} /> },
          { header: "Kafedra", cell: (p) => p.departmentName ?? "—" },
          { header: "Holat",   cell: (p) => <ActiveBadge active={p.active} /> },
        ]}
        blankForm={() => ({ name: "", code: "", degreeLevel: "BACHELOR", departmentId: null, active: true })}
        toForm={(p) => ({
          name: p.name, code: p.code ?? "",
          degreeLevel: p.degreeLevel ?? "BACHELOR",
          departmentId: p.departmentId ?? null, active: p.active,
        })}
        validate={(f) => (f.name.trim() ? null : "Nomi majburiy")}
        onCreate={(f) =>
          createProgram({
            name: f.name.trim(), code: f.code.trim() || null,
            degreeLevel: f.degreeLevel, departmentId: f.departmentId, active: f.active,
          }).then(() => undefined)
        }
        onUpdate={(id, f) =>
          updateProgram(id, {
            name: f.name.trim(), code: f.code.trim() || null,
            degreeLevel: f.degreeLevel, departmentId: f.departmentId, active: f.active,
          }).then(() => undefined)
        }
        onDelete={(id) => deleteProgram(id)}
        renderForm={(form, set) => (
          <>
            <div className="space-y-1.5">
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Masalan: Dasturiy injiniring"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kodi</Label>
                <Input
                  value={form.code}
                  onChange={(e) => set({ code: e.target.value })}
                  placeholder="Masalan: 5330200"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Daraja</Label>
                <Select
                  value={form.degreeLevel}
                  onValueChange={(v) => set({ degreeLevel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
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
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {departments.items.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
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
    </div>
  );
}
