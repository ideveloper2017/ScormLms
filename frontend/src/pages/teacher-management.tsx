import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { KeyRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { DepartmentSelect } from "@/components/admin/department-select";
import { COMMON_DEPARTMENT_LABEL } from "@/lib/departments";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import { listDepartments, listSubjects } from "@/lib/academic-api";
import {
  TeacherRecord, createTeacher, deleteTeacher, listTeachers, updateTeacher,
} from "@/lib/teacher-api";

interface TeacherForm {
  fullName: string;
  phone: string;
  email: string;
  academicDegree: string;
  academicRank: string;
  position: string;
  departmentId: number | null;
  subjectIds: number[];
  active: boolean;
  hemisEmployeeId: string;
  hemisLogin: string;
  username: string;
  password: string;
}

export function TeacherManagement() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "TEACHER_WRITE");
  const { items, loading, error, reload } = useCrudData<TeacherRecord>(qk.teachers(), listTeachers);
  const { data: departments = [] } = useQuery({ queryKey: qk.departments(), queryFn: () => listDepartments(), staleTime: 60_000 });
  const { data: subjects = [] } = useQuery({ queryKey: qk.subjects(), queryFn: () => listSubjects(), staleTime: 60_000 });

  const departmentFaculty = new Map(departments.map((d) => [d.id, d.facultyName ?? COMMON_DEPARTMENT_LABEL]));

  const toggleSubject = (form: TeacherForm, id: number): number[] =>
    form.subjectIds.includes(id)
      ? form.subjectIds.filter((s) => s !== id)
      : [...form.subjectIds, id];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <CrudSection<TeacherRecord, TeacherForm>
        title="O'qituvchilar"
        description="Professor-o'qituvchilar tarkibini boshqarish"
        searchPlaceholder="Ism, kafedra yoki login bo'yicha qidirish..."
        items={items}
        loading={loading}
        error={error}
        onReload={reload}
        canWrite={canWrite}
        getId={(t) => t.id}
        getName={(t) => t.fullName}
        search={(t) => `${t.fullName} ${t.departmentName ?? ""} ${t.username ?? ""} ${t.position ?? ""} ${t.hemisLogin ?? ""} ${t.hemisEmployeeId ?? ""}`}
        columns={[
          { header: "F.I.O", cell: (t) => <span className="font-medium">{t.fullName}</span> },
          {
            header: "Kafedra",
            cell: (t) => t.departmentName
              ? (
                <div>
                  <div>{t.departmentName}</div>
                  {t.departmentId != null && departmentFaculty.has(t.departmentId) && (
                    <div className="text-xs text-muted-foreground">{departmentFaculty.get(t.departmentId)}</div>
                  )}
                </div>
              )
              : "—",
          },
          { header: "Lavozim", cell: (t) => t.position ?? "—" },
          {
            header: "Login",
            cell: (t) => t.username
              ? <span className="inline-flex items-center gap-1 text-sm"><KeyRound className="h-3 w-3" />{t.username}</span>
              : <span className="text-muted-foreground">—</span>,
          },
          {
            header: "HEMIS",
            cell: (t) => t.hemisEmployeeId || t.hemisLogin
              ? <Badge variant="outline" className="font-normal">{t.hemisLogin ?? `ID ${t.hemisEmployeeId}`}</Badge>
              : <span className="text-muted-foreground">—</span>,
          },
          { header: "Fanlar", cell: (t) => (t.subjects ?? []).length },
          {
            header: "Holat",
            cell: (t) => <Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Faol" : "Nofaol"}</Badge>,
          },
        ]}
        blankForm={() => ({
          fullName: "", phone: "", email: "", academicDegree: "", academicRank: "",
          position: "", departmentId: null, subjectIds: [], active: true, hemisEmployeeId: "", hemisLogin: "", username: "", password: "",
        })}
        toForm={(t) => ({
          fullName: t.fullName,
          phone: t.phone ?? "",
          email: t.email ?? "",
          academicDegree: t.academicDegree ?? "",
          academicRank: t.academicRank ?? "",
          position: t.position ?? "",
          departmentId: t.departmentId ?? null,
          subjectIds: (t.subjects ?? []).map((s) => s.id),
          active: t.active,
          hemisEmployeeId: t.hemisEmployeeId ?? "",
          hemisLogin: t.hemisLogin ?? "",
          username: "",
          password: "",
        })}
        validate={(f) => {
          if (!f.fullName.trim()) return "F.I.O majburiy";
          if (f.username.trim() && !f.password.trim()) return "Login uchun parol kiriting";
          if (f.username.trim() && f.password.trim().length < 12) return "Parol kamida 12 ta belgi bo‘lishi kerak";
          if (!f.username.trim() && f.password.trim()) return "Parol uchun login kiriting";
          return null;
        }}
        onCreate={(f) => createTeacher({
          fullName: f.fullName.trim(),
          phone: f.phone || null,
          email: f.email || null,
          academicDegree: f.academicDegree || null,
          academicRank: f.academicRank || null,
          position: f.position || null,
          departmentId: f.departmentId,
          subjectIds: f.subjectIds,
          active: f.active,
          hemisEmployeeId: f.hemisEmployeeId.trim() || null,
          hemisLogin: f.hemisLogin.trim() || null,
          username: f.username.trim() || null,
          password: f.password.trim() || null,
        }).then(() => undefined)}
        onUpdate={(id, f) => updateTeacher(id, {
          fullName: f.fullName.trim(),
          phone: f.phone || null,
          email: f.email || null,
          academicDegree: f.academicDegree || null,
          academicRank: f.academicRank || null,
          position: f.position || null,
          departmentId: f.departmentId,
          subjectIds: f.subjectIds,
          active: f.active,
          hemisEmployeeId: f.hemisEmployeeId.trim(),
          hemisLogin: f.hemisLogin.trim(),
        }).then(() => undefined)}
        onDelete={(id) => deleteTeacher(id)}
        renderForm={(form, set, { isEdit }) => (
          <>
            <div className="space-y-1.5">
              <Label>F.I.O <span className="text-destructive">*</span></Label>
              <Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Familiya Ism Otasining ismi" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+998..." />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ilmiy daraja</Label>
                <Input value={form.academicDegree} onChange={(e) => set({ academicDegree: e.target.value })} placeholder="PhD, DSc" />
              </div>
              <div className="space-y-1.5">
                <Label>Ilmiy unvon</Label>
                <Input value={form.academicRank} onChange={(e) => set({ academicRank: e.target.value })} placeholder="dotsent, professor" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Lavozim</Label>
                <Input value={form.position} onChange={(e) => set({ position: e.target.value })} placeholder="katta o'qituvchi" />
              </div>
              <div className="space-y-1.5">
                <Label>Kafedra</Label>
                <DepartmentSelect
                  departments={departments}
                  value={form.departmentId}
                  onChange={(departmentId) => set({ departmentId })}
                />
                <p className="text-xs text-muted-foreground">Istalgan fakultet yoki umumiy kafedrani tanlash mumkin</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fanlar</Label>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Fanlar mavjud emas</p>
              ) : (
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="space-y-2">
                    {subjects.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.subjectIds.includes(s.id)}
                          onCheckedChange={() => set({ subjectIds: toggleSubject(form, s.id) })}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="rounded-md border border-dashed p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                HEMIS orqali kirish — o'qituvchi HEMIS xodim logini bilan kiradi. HEMIS ID yoki loginidan
                kamida bittasini kiriting; LMS logini bo'lmasa, birinchi kirishda avtomatik yaratiladi.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>HEMIS ID</Label>
                  <Input value={form.hemisEmployeeId} onChange={(e) => set({ hemisEmployeeId: e.target.value })} placeholder="employee_id_number" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label>HEMIS login</Label>
                  <Input value={form.hemisLogin} onChange={(e) => set({ hemisLogin: e.target.value })} autoComplete="off" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} />
              <Label>Faol</Label>
            </div>

            {!isEdit && (
              <div className="rounded-md border border-dashed p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Login akkaunti (ixtiyoriy) — to'ldirilsa, o'qituvchi tizimga kira oladi (rol: teacher).
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Login</Label>
                    <Input value={form.username} onChange={(e) => set({ username: e.target.value })} autoComplete="off" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Parol</Label>
                    <Input type="password" value={form.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      />
    </div>
  );
}
