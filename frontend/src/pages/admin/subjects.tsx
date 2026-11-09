import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { NotebookText } from "lucide-react";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  type SubjectRecord,
  createSubject, deleteSubject, listSubjects, updateSubject,
  listPrograms, listSubjectCategories,
} from "@/lib/academic-api";

interface SubjectForm {
  name: string;
  nameEn: string;
  nameRu: string;
  nameKaa: string;
  nameUzCyrillic: string;
  code: string;
  /** Formada ko'rinmaydi — kredit o'quv rejada (har semestr qatorida) belgilanadi; tahrirda eski qiymat saqlanadi */
  credits: string;
  subjectType: "" | "PRACTICE" | "COURSE_WORK" | "STATE_ATTESTATION" | "GRADUATION_WORK";
  programId: number | null;
  subjectCategoryId: number | null;
  active: boolean;
}

const subjectTypeLabel: Record<string, string> = {
  PRACTICE: "Amaliyot", COURSE_WORK: "Kurs ishi", STATE_ATTESTATION: "Davlat attestatsiyasi", GRADUATION_WORK: "Bitiruv ishi",
};

// O'quv rejaga kodi bor fan qo'shiladi; kredit va soatlar o'quv rejada beriladi
const validateSubject = (f: SubjectForm): string | null => {
  if (!f.name.trim()) return "Fan nomi majburiy";
  if (!f.code.trim()) return "Fan kodi majburiy (o'quv rejaga qo'shish uchun kerak)";
  return null;
};

const parseCredits = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

export function AdminSubjects() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const subjects = useCrudData<SubjectRecord>(qk.subjects(), listSubjects);
  const { data: programs = [] } = useQuery({
    queryKey: qk.programs(),
    queryFn: () => listPrograms(),
    staleTime: 60_000,
  });
  const { data: subjectCategories = [] } = useQuery({
    queryKey: qk.subjectCategories(),
    queryFn: listSubjectCategories,
    staleTime: 60_000,
  });

  const activeCount    = subjects.items.filter((s) => s.active).length;
  const inactiveCount  = subjects.items.length - activeCount;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
            <NotebookText className="h-3.5 w-3.5" />
            <span className="text-xs">Ta'lim jarayoni</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Fanlar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            O'quv fanlari katalogi — kredit va soatlar o'quv rejada belgilanadi
          </p>
        </div>

        {!subjects.loading && subjects.items.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary" className="text-xs">
              Jami: {subjects.items.length}
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
      <CrudSection<SubjectRecord, SubjectForm>
        title="Fanlar"
        description="Fan qo'shish, tahrirlash va o'chirish"
        searchPlaceholder="Fan nomi, kodi, guruhi yoki yo'nalish..."
        items={subjects.items}
        loading={subjects.loading}
        error={subjects.error}
        onReload={subjects.reload}
        canWrite={canWrite}
        getId={(s) => s.id}
        getName={(s) => s.name}
        search={(s) => `${s.name} ${s.code ?? ""} ${s.subjectCategoryName ?? ""} ${s.programName ?? ""}`}
        columns={[
          { header: "Nomi",      cell: (s) => <span className="font-medium">{s.name}</span> },
          { header: "Kodi",      cell: (s) => s.code ?? "—" },
          { header: "Yo'nalish", cell: (s) => s.programName ?? "—" },
          { header: "Fan guruhi", cell: (s) => s.subjectCategoryName ?? "—" },
          { header: "Fan turi", cell: (s) => (s.subjectType ? subjectTypeLabel[s.subjectType] : "Oddiy fan") },
          {
            header: "Holat",
            cell: (s) => (
              <Badge variant={s.active ? "default" : "secondary"}>
                {s.active ? "Faol" : "Nofaol"}
              </Badge>
            ),
          },
        ]}
        blankForm={() => ({ name: "", nameEn: "", nameRu: "", nameKaa: "", nameUzCyrillic: "", code: "", credits: "", subjectType: "", programId: null, subjectCategoryId: null, active: true })}
        toForm={(s) => ({
          name: s.name,
          nameEn: s.nameEn ?? "", nameRu: s.nameRu ?? "", nameKaa: s.nameKaa ?? "", nameUzCyrillic: s.nameUzCyrillic ?? "",
          code: s.code ?? "",
          credits: s.credits != null ? String(s.credits) : "",
          subjectType: s.subjectType ?? "",
          programId: s.programId ?? null,
          subjectCategoryId: s.subjectCategoryId ?? null,
          active: s.active,
        })}
        validate={validateSubject}
        onCreate={(f) =>
          createSubject({
            name: f.name.trim(),
            nameEn: f.nameEn.trim() || null, nameRu: f.nameRu.trim() || null, nameKaa: f.nameKaa.trim() || null, nameUzCyrillic: f.nameUzCyrillic.trim() || null,
            code: f.code.trim() || null,
            subjectType: f.subjectType || null,
            programId: f.programId,
            subjectCategoryId: f.subjectCategoryId,
            active: f.active,
          }).then(() => undefined)
        }
        onUpdate={(id, f) =>
          updateSubject(id, {
            name: f.name.trim(),
            nameEn: f.nameEn.trim() || null, nameRu: f.nameRu.trim() || null, nameKaa: f.nameKaa.trim() || null, nameUzCyrillic: f.nameUzCyrillic.trim() || null,
            code: f.code.trim() || null,
            credits: parseCredits(f.credits),
            subjectType: f.subjectType || null,
            programId: f.programId,
            subjectCategoryId: f.subjectCategoryId,
            clearSubjectCategory: f.subjectCategoryId == null,
            clearOptionalFields: true,
            active: f.active,
          }).then(() => undefined)
        }
        onDelete={(id) => deleteSubject(id)}
        renderForm={(form, set) => (
          <>
            <div className="space-y-1.5">
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="masalan: Matematik analiz"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kodi</Label>
              <Input
                value={form.code}
                onChange={(e) => set({ code: e.target.value })}
                placeholder="MA101"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fan guruhi</Label>
              <Select
                value={form.subjectCategoryId != null ? String(form.subjectCategoryId) : "none"}
                onValueChange={(v) => set({ subjectCategoryId: v === "none" ? null : Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {subjectCategories.filter((category) => category.active || category.id === form.subjectCategoryId).map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fan turi</Label>
              <Select value={form.subjectType || "none"} onValueChange={(value) => set({ subjectType: value === "none" ? "" : value as SubjectForm["subjectType"] })}>
                <SelectTrigger><SelectValue placeholder="Oddiy fan" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Oddiy fan</SelectItem><SelectItem value="PRACTICE">Amaliyot</SelectItem><SelectItem value="COURSE_WORK">Kurs ishi</SelectItem><SelectItem value="STATE_ATTESTATION">Davlat attestatsiyasi</SelectItem><SelectItem value="GRADUATION_WORK">Bitiruv ishi</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>English</Label><Input value={form.nameEn} onChange={(e) => set({ nameEn: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Русский</Label><Input value={form.nameRu} onChange={(e) => set({ nameRu: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Qaraqalpaqsha</Label><Input value={form.nameKaa} onChange={(e) => set({ nameKaa: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Ўзбекча</Label><Input value={form.nameUzCyrillic} onChange={(e) => set({ nameUzCyrillic: e.target.value })} /></div>
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
