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
  GroupRecord, ProgramRecord, createGroup, deleteGroup, listGroups,
  listPrograms, updateGroup,
} from "@/lib/academic-api";

interface GroupForm {
  name: string;
  programId: number | null;
  educationYear: string;
  language: string;
  active: boolean;
}

const LANGS = [
  { value: "uz", label: "O'zbek" },
  { value: "ru", label: "Rus" },
  { value: "en", label: "Ingliz" },
];

export function Groups() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { items, loading, error, reload } = useCrudData<GroupRecord>(qk.groups(), listGroups);
  const { data: programs = [] } = useQuery({ queryKey: qk.programs(), queryFn: listPrograms, staleTime: 60_000 });

  return (
    <div className="p-6">
      <CrudSection<GroupRecord, GroupForm>
        title="Guruhlar"
        description="O'quv guruhlarini boshqarish"
        searchPlaceholder="Guruh nomi bo'yicha qidirish..."
        items={items}
        loading={loading}
        error={error}
        onReload={reload}
        canWrite={canWrite}
        getId={(g) => g.id}
        getName={(g) => g.name}
        search={(g) => `${g.name} ${g.programName ?? ""} ${g.educationYear ?? ""}`}
        columns={[
          { header: "Nomi", cell: (g) => <span className="font-medium">{g.name}</span> },
          { header: "Yo'nalish", cell: (g) => g.programName ?? "—" },
          { header: "O'quv yili", cell: (g) => g.educationYear ?? "—" },
          { header: "Til", cell: (g) => LANGS.find((l) => l.value === g.language)?.label ?? g.language ?? "—" },
          {
            header: "Holat",
            cell: (g) => (
              <Badge variant={g.active ? "default" : "secondary"}>
                {g.active ? "Faol" : "Nofaol"}
              </Badge>
            ),
          },
        ]}
        blankForm={() => ({ name: "", programId: null, educationYear: "", language: "uz", active: true })}
        toForm={(g) => ({
          name: g.name,
          programId: g.programId ?? null,
          educationYear: g.educationYear ?? "",
          language: g.language ?? "uz",
          active: g.active,
        })}
        validate={(f) => (f.name.trim() ? null : "Guruh nomi majburiy")}
        onCreate={(f) => createGroup({
          name: f.name.trim(),
          programId: f.programId,
          educationYear: f.educationYear || null,
          language: f.language,
          active: f.active,
        }).then(() => undefined)}
        onUpdate={(id, f) => updateGroup(id, {
          name: f.name.trim(),
          programId: f.programId,
          educationYear: f.educationYear || null,
          language: f.language,
          active: f.active,
        }).then(() => undefined)}
        onDelete={(id) => deleteGroup(id)}
        renderForm={(form, set) => (
          <>
            <div className="space-y-1.5">
              <Label>Nomi <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="masalan: 101-22" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>O'quv yili</Label>
                <Input value={form.educationYear} onChange={(e) => set({ educationYear: e.target.value })} placeholder="2024-2025" />
              </div>
              <div className="space-y-1.5">
                <Label>Til</Label>
                <Select value={form.language} onValueChange={(v) => set({ language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
