import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Layers3 } from "lucide-react";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  type GroupRecord,
  createGroup, deleteGroup, listGroups, updateGroup,
  listPrograms,
} from "@/lib/academic-api";

interface GroupForm {
  name: string;
  programId: number | null;
  educationYear: string;
  language: string;
  active: boolean;
}

const LANGS = [
  { value: "uz", label: "O'zbek"  },
  { value: "ru", label: "Rus"     },
  { value: "en", label: "Ingliz"  },
];

const LANG_COLORS: Record<string, string> = {
  uz: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ru: "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300",
  en: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

function LangBadge({ lang }: { lang: string | null | undefined }) {
  const entry = LANGS.find((l) => l.value === lang);
  const label = entry?.label ?? lang ?? "—";
  const cls   = lang ? (LANG_COLORS[lang] ?? "") : "";
  return <Badge className={`text-xs ${cls}`}>{label}</Badge>;
}

export function AdminGroups() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const groups   = useCrudData<GroupRecord>(qk.groups(), listGroups);
  const { data: programs = [] } = useQuery({
    queryKey: qk.programs(),
    queryFn: listPrograms,
    staleTime: 60_000,
  });

  const activeCount   = groups.items.filter((g) => g.active).length;
  const inactiveCount = groups.items.length - activeCount;
  const byLang = LANGS.map((l) => ({
    ...l,
    count: groups.items.filter((g) => g.language === l.value).length,
  }));

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
            <Layers3 className="h-3.5 w-3.5" />
            <span className="text-xs">Akademik tuzilma</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Guruhlar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            O'quv guruhlarini yo'nalish va o'quv yili bo'yicha boshqaring
          </p>
        </div>

        {!groups.loading && groups.items.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary" className="text-xs">
              Jami: {groups.items.length}
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
            {byLang.filter((l) => l.count > 0).map((l) => (
              <Badge key={l.value} className={`text-xs ${LANG_COLORS[l.value] ?? ""}`}>
                {l.label}: {l.count}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* CRUD table */}
      <CrudSection<GroupRecord, GroupForm>
        title="Guruhlar"
        description="Guruh qo'shish, tahrirlash va o'chirish"
        searchPlaceholder="Guruh nomi, yo'nalish yoki o'quv yili..."
        items={groups.items}
        loading={groups.loading}
        error={groups.error}
        onReload={groups.reload}
        canWrite={canWrite}
        getId={(g) => g.id}
        getName={(g) => g.name}
        search={(g) => `${g.name} ${g.programName ?? ""} ${g.educationYear ?? ""}`}
        columns={[
          { header: "Nomi",       cell: (g) => <span className="font-medium">{g.name}</span> },
          { header: "Yo'nalish",  cell: (g) => g.programName ?? "—" },
          { header: "O'quv yili", cell: (g) => g.educationYear ?? "—" },
          { header: "Til",        cell: (g) => <LangBadge lang={g.language} /> },
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
        onCreate={(f) =>
          createGroup({
            name: f.name.trim(),
            programId: f.programId,
            educationYear: f.educationYear || null,
            language: f.language,
            active: f.active,
          }).then(() => undefined)
        }
        onUpdate={(id, f) =>
          updateGroup(id, {
            name: f.name.trim(),
            programId: f.programId,
            educationYear: f.educationYear || null,
            language: f.language,
            active: f.active,
          }).then(() => undefined)
        }
        onDelete={(id) => deleteGroup(id)}
        renderForm={(form, set) => (
          <>
            <div className="space-y-1.5">
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="masalan: DI-101-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Yo'nalish</Label>
              <Select
                value={form.programId != null ? String(form.programId) : "none"}
                onValueChange={(v) => set({ programId: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>O'quv yili</Label>
                <Input
                  value={form.educationYear}
                  onChange={(e) => set({ educationYear: e.target.value })}
                  placeholder="2024-2025"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ta'lim tili</Label>
                <Select value={form.language} onValueChange={(v) => set({ language: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
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
