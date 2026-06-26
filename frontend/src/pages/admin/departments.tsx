import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building } from "lucide-react";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  type DepartmentRecord, type FacultyRecord,
  createDepartment, deleteDepartment, listDepartments, updateDepartment,
  listFaculties,
} from "@/lib/academic-api";

interface DepartmentForm {
  name: string;
  code: string;
  facultyId: number | null;
  active: boolean;
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Faol" : "Nofaol"}
    </Badge>
  );
}

export function AdminDepartments() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const departments = useCrudData<DepartmentRecord>(["departments"], listDepartments);
  const faculties   = useCrudData<FacultyRecord>(["faculties"], listFaculties);

  const activeCount   = departments.items.filter((d) => d.active).length;
  const inactiveCount = departments.items.length - activeCount;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
            <Building className="h-3.5 w-3.5" />
            <span className="text-xs">Akademik tuzilma</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Kafedralar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fakultetlar tarkibidagi kafedralarni boshqaring
          </p>
        </div>

        {!departments.loading && departments.items.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary" className="text-xs">
              Jami: {departments.items.length}
            </Badge>
            {activeCount > 0 && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                Faol: {activeCount}
              </Badge>
            )}
            {inactiveCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Nofaol: {inactiveCount}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* CRUD table */}
      <CrudSection<DepartmentRecord, DepartmentForm>
        title="Kafedralar"
        description="Kafedra qo'shish, tahrirlash va o'chirish"
        items={departments.items}
        loading={departments.loading}
        error={departments.error}
        onReload={departments.reload}
        canWrite={canWrite}
        getId={(d) => d.id}
        getName={(d) => d.name}
        search={(d) => `${d.name} ${d.code ?? ""} ${d.facultyName ?? ""}`}
        searchPlaceholder="Kafedra nomi, kodi yoki fakultet..."
        columns={[
          { header: "Nomi",     cell: (d) => <span className="font-medium">{d.name}</span> },
          { header: "Kodi",     cell: (d) => d.code ?? "—" },
          { header: "Fakultet", cell: (d) => d.facultyName ?? "—" },
          { header: "Holat",    cell: (d) => <ActiveBadge active={d.active} /> },
        ]}
        blankForm={() => ({ name: "", code: "", facultyId: null, active: true })}
        toForm={(d) => ({
          name: d.name, code: d.code ?? "",
          facultyId: d.facultyId ?? null, active: d.active,
        })}
        validate={(f) => (f.name.trim() ? null : "Nomi majburiy")}
        onCreate={(f) =>
          createDepartment({
            name: f.name.trim(), code: f.code.trim() || null,
            facultyId: f.facultyId, active: f.active,
          }).then(() => undefined)
        }
        onUpdate={(id, f) =>
          updateDepartment(id, {
            name: f.name.trim(), code: f.code.trim() || null,
            facultyId: f.facultyId, active: f.active,
          }).then(() => undefined)
        }
        onDelete={(id) => deleteDepartment(id)}
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
            <div className="space-y-1.5">
              <Label>Kodi</Label>
              <Input
                value={form.code}
                onChange={(e) => set({ code: e.target.value })}
                placeholder="Masalan: DI"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fakultet</Label>
              <Select
                value={form.facultyId != null ? String(form.facultyId) : "none"}
                onValueChange={(v) => set({ facultyId: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {faculties.items.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
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
