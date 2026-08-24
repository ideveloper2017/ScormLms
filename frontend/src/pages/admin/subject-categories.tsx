import { Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import {
  type SubjectCategoryRecord,
  createSubjectCategory,
  deleteSubjectCategory,
  listSubjectCategories,
  updateSubjectCategory,
} from "@/lib/academic-api";
import { qk } from "@/lib/query-keys";
import { hasAuthority } from "@/lib/rbac-api";

interface SubjectCategoryForm {
  name: string;
  code: string;
  nameEn: string;
  nameRu: string;
  nameKaa: string;
  nameUzCyrillic: string;
  active: boolean;
}

export function AdminSubjectCategories() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const categories = useCrudData<SubjectCategoryRecord>(qk.subjectCategories(), listSubjectCategories);

  return <div className="space-y-6 p-3 sm:p-6">
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        <Layers3 className="h-4 w-4" />
        <span className="text-xs">Ta'lim jarayoni</span>
      </div>
      <h1 className="text-2xl font-bold">Fan guruhlari</h1>
      <p className="text-sm text-muted-foreground">
        Fanlarni yo'nalish bo'yicha emas, sohasi bo'yicha guruhlang: masalan, Oliy matematika, Fizika yoki Xorijiy tillar.
      </p>
    </div>

    <CrudSection<SubjectCategoryRecord, SubjectCategoryForm>
      title="Fan guruhlari katalogi"
      description="Bu guruhga talaba biriktirilmaydi; u fanlarni tartiblash uchun ishlatiladi."
      searchPlaceholder="Nomi yoki kodi..."
      items={categories.items}
      loading={categories.loading}
      error={categories.error}
      onReload={categories.reload}
      canWrite={canWrite}
      getId={(category) => category.id}
      getName={(category) => category.name}
      search={(category) => `${category.name} ${category.code ?? ""}`}
      columns={[
        { header: "Nomi", cell: (category) => <span className="font-medium">{category.name}</span> },
        { header: "Kodi", cell: (category) => category.code ?? "—" },
        { header: "Holat", cell: (category) => <Badge variant={category.active ? "default" : "secondary"}>{category.active ? "Faol" : "Nofaol"}</Badge> },
      ]}
      blankForm={() => ({ name: "", code: "", nameEn: "", nameRu: "", nameKaa: "", nameUzCyrillic: "", active: true })}
      toForm={(category) => ({ name: category.name, code: category.code ?? "", nameEn: category.nameEn ?? "", nameRu: category.nameRu ?? "", nameKaa: category.nameKaa ?? "", nameUzCyrillic: category.nameUzCyrillic ?? "", active: category.active })}
      validate={(form) => form.name.trim().length >= 3 ? null : "Fan guruhi nomi kamida 3 belgi bo'lishi kerak"}
      onCreate={(form) => createSubjectCategory({ name: form.name.trim(), code: form.code.trim() || null, nameEn: form.nameEn.trim() || null, nameRu: form.nameRu.trim() || null, nameKaa: form.nameKaa.trim() || null, nameUzCyrillic: form.nameUzCyrillic.trim() || null, active: form.active }).then(() => undefined)}
      onUpdate={(id, form) => updateSubjectCategory(id, { name: form.name.trim(), code: form.code.trim() || null, clearCode: !form.code.trim(), clearTranslations: true, nameEn: form.nameEn.trim() || null, nameRu: form.nameRu.trim() || null, nameKaa: form.nameKaa.trim() || null, nameUzCyrillic: form.nameUzCyrillic.trim() || null, active: form.active }).then(() => undefined)}
      onDelete={deleteSubjectCategory}
      renderForm={(form, set) => <>
        <div className="space-y-1.5">
          <Label>Nomi <span className="text-destructive">*</span></Label>
          <Input value={form.name} onChange={(event) => set({ name: event.target.value })} placeholder="masalan: Oliy matematika" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>English</Label><Input value={form.nameEn} onChange={(event) => set({ nameEn: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Русский</Label><Input value={form.nameRu} onChange={(event) => set({ nameRu: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Qaraqalpaqsha</Label><Input value={form.nameKaa} onChange={(event) => set({ nameKaa: event.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ўзбекча</Label><Input value={form.nameUzCyrillic} onChange={(event) => set({ nameUzCyrillic: event.target.value })} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Kodi</Label>
          <Input value={form.code} onChange={(event) => set({ code: event.target.value })} placeholder="MATH" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.active} onCheckedChange={(active) => set({ active })} />
          <Label>Faol</Label>
        </div>
      </>}
    />
  </div>;
}
