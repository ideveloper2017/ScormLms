import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import { createTutorGroup, deleteTutorGroup, getTutorGroupOptions, listTutorGroups, updateTutorGroup, type SaveTutorGroupRequest, type TutorGroupRecord } from "@/services/api/tutor-group-api";

const NONE = "__none__";
const blank = (): SaveTutorGroupRequest => ({ name: "", code: "", facultyId: null, tutorId: null, nameUz: "", nameRu: "", nameEn: "", active: true });

export function TutorGroups() {
  const { user } = useAuth(); const data = useCrudData<TutorGroupRecord>(["tutor-groups"], listTutorGroups);
  const options = useQuery({ queryKey: ["tutor-group-options"], queryFn: getTutorGroupOptions, staleTime: 60_000 });
  return <div className="space-y-6 p-3 sm:p-6"><div><h1 className="text-2xl font-bold">O'qituvchi guruhlari</h1><p className="text-sm text-muted-foreground">Tutor guruhining kodi, fakulteti, biriktirilgan tutori va uch tildagi nomlari.</p></div>
    <CrudSection<TutorGroupRecord, SaveTutorGroupRequest> title="Tutor guruhlari" items={data.items} loading={data.loading} error={data.error} onReload={data.reload} canWrite={hasAuthority(user, "ACADEMIC_WRITE")}
      getId={(item) => item.id} getName={(item) => item.name} search={(item) => `${item.name} ${item.code} ${item.facultyName} ${item.tutorName} ${item.nameRu} ${item.nameEn}`}
      columns={[{ header: "Nomi", cell: (item) => <span className="font-medium">{item.name}</span> }, { header: "Kodi", cell: (item) => <Badge variant="outline">{item.code}</Badge> }, { header: "Fakultet", cell: (item) => item.facultyName || "—" }, { header: "Tutor", cell: (item) => item.tutorName || "—" }, { header: "Tarjimalar", cell: (item) => <div className="text-xs"><div>UZ: {item.nameUz || "—"}</div><div>RU: {item.nameRu || "—"}</div><div>EN: {item.nameEn || "—"}</div></div> }, { header: "Holat", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Faol emas"}</Badge> }]}
      blankForm={blank} toForm={(item) => ({ name: item.name, code: item.code, facultyId: item.facultyId, tutorId: item.tutorId, nameUz: item.nameUz, nameRu: item.nameRu, nameEn: item.nameEn, active: item.active })}
      validate={(form) => form.name.trim().length < 2 ? "Nomi kamida 2 belgi" : form.code.trim().length < 2 ? "Kodi kamida 2 belgi" : null}
      onCreate={(form) => createTutorGroup(form).then(() => undefined)} onUpdate={(id, form) => updateTutorGroup(id, form).then(() => undefined)} onDelete={deleteTutorGroup}
      renderForm={(form, set) => <div className="grid gap-4"><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Nomi *</Label><Input value={form.name} onChange={(event) => set({ name: event.target.value })} /></div><div className="space-y-1.5"><Label>Kodi *</Label><Input value={form.code} onChange={(event) => set({ code: event.target.value.toUpperCase() })} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Fakultet</Label><Select value={form.facultyId ? String(form.facultyId) : NONE} onValueChange={(value) => set({ facultyId: value === NONE ? null : Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Biriktirilmagan</SelectItem>{(options.data?.faculties ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Tutor</Label><Select value={form.tutorId ? String(form.tutorId) : NONE} onValueChange={(value) => set({ tutorId: value === NONE ? null : Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Biriktirilmagan</SelectItem>{(options.data?.tutors ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-1.5"><Label>O'zbekcha nomi</Label><Input value={form.nameUz ?? ""} onChange={(event) => set({ nameUz: event.target.value })} /></div><div className="space-y-1.5"><Label>Ruscha nomi</Label><Input value={form.nameRu ?? ""} onChange={(event) => set({ nameRu: event.target.value })} /></div><div className="space-y-1.5"><Label>Inglizcha nomi</Label><Input value={form.nameEn ?? ""} onChange={(event) => set({ nameEn: event.target.value })} /></div><div className="flex items-center justify-between rounded-md border p-3"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={(active) => set({ active })} /></div></div>}
    />
  </div>;
}
