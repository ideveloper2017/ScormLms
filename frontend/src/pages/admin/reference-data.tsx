import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  createNationality,
  createReferenceLabel,
  deleteNationality,
  deleteReferenceLabel,
  listNationalities,
  listReferenceLabels,
  updateNationality,
  updateReferenceLabel,
  type LocalizedValues,
  type NationalityRecord,
  type ReferenceLabelRecord,
  type SaveNationalityRequest,
  type SaveReferenceLabelRequest,
} from "@/services/api/system-catalog-api";

const emptyTranslations = (): LocalizedValues => ({ uzLatin: "", uzCyrillic: "", kaa: "", ru: "", en: "" });

function PageHeader({ title, description }: { title: string; description: string }) {
  return <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>;
}

function TranslationInputs({ value, onChange }: { value: LocalizedValues; onChange: (value: LocalizedValues) => void }) {
  const fields: Array<[keyof LocalizedValues, string]> = [
    ["uzLatin", "O'Z — O'zbekcha"],
    ["uzCyrillic", "УЗ — Ўзбекча"],
    ["kaa", "QQ — Qaraqalpaqsha"],
    ["ru", "RU — Русский"],
    ["en", "EN — English"],
  ];
  return <div className="grid gap-3 sm:grid-cols-2">
    {fields.map(([key, label]) => <div className="space-y-1.5" key={key}>
      <Label>{label}</Label>
      <Input value={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.value })} placeholder="Qiymatni kiriting" />
    </div>)}
  </div>;
}

function TranslationBadges({ value }: { value: LocalizedValues }) {
  const active = [["O'Z", value.uzLatin], ["УЗ", value.uzCyrillic], ["QQ", value.kaa], ["RU", value.ru], ["EN", value.en]];
  return <div className="flex flex-wrap gap-1">{active.filter(([, text]) => text.trim()).map(([code]) => <Badge key={code} variant="outline">{code}</Badge>)}</div>;
}

const emptyLabel = (): SaveReferenceLabelRequest => ({
  key: "", label: "", moduleName: "", active: true, translations: emptyTranslations(),
});

export function AdminReferenceLabels() {
  const { user } = useAuth();
  const data = useCrudData<ReferenceLabelRecord>(["reference-labels"], listReferenceLabels);
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");

  return <div className="space-y-6 p-3 sm:p-6">
    <PageHeader title="Yorliqlar" description="Tizim klassifikatorlari kaliti, ko'rinadigan yorlig'i, moduli va tarjimalari." />
    <CrudSection<ReferenceLabelRecord, SaveReferenceLabelRequest>
      title="Yorliqlar"
      items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={canWrite} getId={(item) => item.id} getName={(item) => item.label}
      search={(item) => `${item.key} ${item.label} ${item.moduleName} ${Object.values(item.translations).join(" ")}`}
      searchPlaceholder="Kalit, yorliq yoki modul bo'yicha qidirish..."
      columns={[
        { header: "Holati", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Faol emas"}</Badge> },
        { header: "Kalit", cell: (item) => <span className="font-mono text-xs">{item.key}</span> },
        { header: "Yorliq", cell: (item) => <span className="font-medium">{item.label}</span> },
        { header: "Modul nomi", cell: (item) => item.moduleName },
        { header: "Tarjimalar", cell: (item) => <TranslationBadges value={item.translations} /> },
      ]}
      blankForm={emptyLabel}
      toForm={(item) => ({ key: item.key, label: item.label, moduleName: item.moduleName, active: item.active, translations: { ...item.translations } })}
      validate={(form) => !form.key.trim() ? "Kalit majburiy" : !form.label.trim() ? "Yorliq majburiy" : !form.moduleName.trim() ? "Modul nomi majburiy" : null}
      onCreate={(form) => createReferenceLabel(form).then(() => undefined)}
      onUpdate={(id, form) => updateReferenceLabel(id, form).then(() => undefined)}
      onDelete={deleteReferenceLabel}
      renderForm={(form, set) => <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Kalit *</Label><Input value={form.key} onChange={(event) => set({ key: event.target.value })} placeholder="masalan: remote" /></div>
          <div className="space-y-1.5"><Label>Modul nomi *</Label><Input value={form.moduleName} onChange={(event) => set({ moduleName: event.target.value })} placeholder="masalan: education_form" /></div>
        </div>
        <div className="space-y-1.5"><Label>Yorliq *</Label><Input value={form.label} onChange={(event) => set({ label: event.target.value })} placeholder="Ko'rinadigan nom" /></div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={(active) => set({ active })} /></div>
        <div className="space-y-2"><Label className="text-base">Tarjimalar</Label><TranslationInputs value={form.translations} onChange={(translations) => set({ translations })} /></div>
      </div>}
    />
  </div>;
}

const emptyNationality = (): SaveNationalityRequest => ({ name: "", active: true, translations: emptyTranslations() });

export function AdminNationalities() {
  const { user } = useAuth();
  const data = useCrudData<NationalityRecord>(["nationalities"], listNationalities);
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");

  return <div className="space-y-6 p-3 sm:p-6">
    <PageHeader title="Millatlar" description="Millat nomlari, faoliyat holati va besh tildagi tarjimalari." />
    <CrudSection<NationalityRecord, SaveNationalityRequest>
      title="Millatlar"
      items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={canWrite} getId={(item) => item.id} getName={(item) => item.name}
      search={(item) => `${item.name} ${Object.values(item.translations).join(" ")}`}
      searchPlaceholder="Millat nomi bo'yicha qidirish..."
      columns={[
        { header: "Nomi", cell: (item) => <span className="font-medium">{item.name}</span> },
        { header: "Holati", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Faol emas"}</Badge> },
        { header: "Tarjimalar", cell: (item) => <TranslationBadges value={item.translations} /> },
      ]}
      blankForm={emptyNationality}
      toForm={(item) => ({ name: item.name, active: item.active, translations: { ...item.translations } })}
      validate={(form) => !form.name.trim() ? "Millat nomi majburiy" : null}
      onCreate={(form) => createNationality(form).then(() => undefined)}
      onUpdate={(id, form) => updateNationality(id, form).then(() => undefined)}
      onDelete={deleteNationality}
      renderForm={(form, set) => <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
        <div className="space-y-1.5"><Label>Nomi *</Label><Input value={form.name} onChange={(event) => set({ name: event.target.value })} placeholder="Millatni kiriting" /></div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={(active) => set({ active })} /></div>
        <div className="space-y-2"><Label className="text-base">Tarjimalar</Label><TranslationInputs value={form.translations} onChange={(translations) => set({ translations })} /></div>
      </div>}
    />
  </div>;
}
