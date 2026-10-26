import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  ProgramRecord, SubjectRecord, createSubject, deleteSubject, listPrograms,
  listSubjects, updateSubject,
} from "@/lib/academic-api";

interface SubjectForm {
  name: string;
  code: string;
  credits: string;
  programId: number | null;
  active: boolean;
}

export function Subjects() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { items, loading, error, reload } = useCrudData<SubjectRecord>(qk.subjects(), listSubjects);
  const { data: programs = [] } = useQuery({ queryKey: qk.programs(), queryFn: () => listPrograms(), staleTime: 60_000 });

  const parseCredits = (s: string): number | null => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <CrudSection<SubjectRecord, SubjectForm>
        title="Fanlar"
        description="O'quv fanlarini boshqarish"
        searchPlaceholder="Fan nomi yoki kodi bo'yicha qidirish..."
        items={items}
        loading={loading}
        error={error}
        onReload={reload}
        canWrite={canWrite}
        getId={(s) => s.id}
        getName={(s) => s.name}
        search={(s) => `${s.name} ${s.code ?? ""} ${s.programName ?? ""}`}
        columns={[
          { header: "Nomi", cell: (s) => <span className="font-medium">{s.name}</span> },
          { header: "Kodi", cell: (s) => s.code ?? "—" },
          { header: "Kredit", cell: (s) => s.credits ?? "—" },
          { header: "Yo'nalish", cell: (s) => s.programName ?? "—" },
          {
            header: "Holat",
            cell: (s) => (
              <Badge variant={s.active ? "default" : "secondary"}>
                {s.active ? "Faol" : "Nofaol"}
              </Badge>
            ),
          },
        ]}
        blankForm={() => ({ name: "", code: "", credits: "", programId: null, active: true })}
        toForm={(s) => ({
          name: s.name,
          code: s.code ?? "",
          credits: s.credits != null ? String(s.credits) : "",
          programId: s.programId ?? null,
          active: s.active,
        })}
        validate={(f) => (f.name.trim() ? null : "Fan nomi majburiy")}
        onCreate={(f) => createSubject({
          name: f.name.trim(),
          code: f.code.trim() || null,
          credits: parseCredits(f.credits),
          programId: f.programId,
          active: f.active,
        }).then(() => undefined)}
        onUpdate={(id, f) => updateSubject(id, {
          name: f.name.trim(),
          code: f.code.trim() || null,
          credits: parseCredits(f.credits),
          programId: f.programId,
          active: f.active,
        }).then(() => undefined)}
        onDelete={(id) => deleteSubject(id)}
        renderForm={(form, set) => (
          <>
            <div className="space-y-1.5">
              <Label>Nomi <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="masalan: Matematik analiz" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kodi</Label>
                <Input value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="MA101" />
              </div>
              <div className="space-y-1.5">
                <Label>Kredit</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.credits}
                  onChange={(e) => set({ credits: e.target.value })}
                  placeholder="6"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Yo'nalish</Label>
              <Select
                value={form.programId != null ? String(form.programId) : "none"}
                onValueChange={(v) => set({ programId: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
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
