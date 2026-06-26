import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  type FacultyRecord,
  createFaculty, deleteFaculty, listFaculties, updateFaculty,
} from "@/lib/academic-api";

interface FacultyForm { name: string; code: string; active: boolean }

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Faol" : "Nofaol"}
    </Badge>
  );
}

export function AdminFaculties() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const faculties = useCrudData<FacultyRecord>(["faculties"], listFaculties);

  const activeCount = faculties.items.filter((f) => f.active).length;
  const inactiveCount = faculties.items.length - activeCount;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="text-xs">Akademik tuzilma</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Fakultetlar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Universitetdagi barcha fakultetlarni boshqaring
          </p>
        </div>

        {!faculties.loading && faculties.items.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary" className="text-xs">
              Jami: {faculties.items.length}
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
      <CrudSection<FacultyRecord, FacultyForm>
        title="Fakultetlar"
        description="Fakultet qo'shish, tahrirlash va o'chirish"
        items={faculties.items}
        loading={faculties.loading}
        error={faculties.error}
        onReload={faculties.reload}
        canWrite={canWrite}
        getId={(f) => f.id}
        getName={(f) => f.name}
        search={(f) => `${f.name} ${f.code ?? ""}`}
        searchPlaceholder="Fakultet nomi yoki kodi..."
        columns={[
          { header: "Nomi", cell: (f) => <span className="font-medium">{f.name}</span> },
          { header: "Kodi", cell: (f) => f.code ?? "—" },
          { header: "Holat", cell: (f) => <ActiveBadge active={f.active} /> },
        ]}
        blankForm={() => ({ name: "", code: "", active: true })}
        toForm={(f) => ({ name: f.name, code: f.code ?? "", active: f.active })}
        validate={(f) => (f.name.trim() ? null : "Nomi majburiy")}
        onCreate={(f) =>
          createFaculty({ name: f.name.trim(), code: f.code.trim() || null, active: f.active }).then(() => undefined)
        }
        onUpdate={(id, f) =>
          updateFaculty(id, { name: f.name.trim(), code: f.code.trim() || null, active: f.active }).then(() => undefined)
        }
        onDelete={(id) => deleteFaculty(id)}
        renderForm={(form, set) => (
          <>
            <div className="space-y-1.5">
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Masalan: Axborot texnologiyalari"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kodi</Label>
              <Input
                value={form.code}
                onChange={(e) => set({ code: e.target.value })}
                placeholder="Masalan: IT"
              />
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
