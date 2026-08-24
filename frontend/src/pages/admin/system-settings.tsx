import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  createTranslationMessage,
  deleteTranslationMessage,
  listSystemLanguages,
  listSystemSettings,
  listTranslationMessages,
  updateSystemSetting,
  updateTranslationMessage,
  type LocalizedValues,
  type SaveTranslationMessageRequest,
  type SystemLanguageRecord,
  type SystemSettingRecord,
  type TranslationCategory,
  type TranslationMessageRecord,
  type UpdateSystemSettingRequest,
} from "@/services/api/system-catalog-api";

const emptyTranslations = (): LocalizedValues => ({ uzLatin: "", uzCyrillic: "", kaa: "", ru: "", en: "" });

function PageHeader({ title, description }: { title: string; description: string }) {
  return <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>;
}

function TranslationInputs({ value, onChange }: { value: LocalizedValues; onChange: (value: LocalizedValues) => void }) {
  const fields: Array<[keyof LocalizedValues, string]> = [
    ["uzLatin", "O'Z — O'zbekcha *"], ["uzCyrillic", "УЗ — Ўзбекча"],
    ["kaa", "QQ — Qaraqalpaqsha"], ["ru", "RU — Русский"], ["en", "EN — English"],
  ];
  return <div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label]) => <div className="space-y-1.5" key={key}>
    <Label>{label}</Label><Input value={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.value })} placeholder="Qiymatni kiriting" />
  </div>)}</div>;
}

export function AdminSystemConfigs() {
  const { user } = useAuth();
  const data = useCrudData<SystemSettingRecord>(["system-settings"], listSystemSettings);
  const canWrite = hasAuthority(user, "USER_MANAGE");
  const empty = (): UpdateSystemSettingRequest => ({ value: "", active: true });

  return <div className="space-y-6 p-3 sm:p-6">
    <PageHeader title="Sozlamalar" description="control-eLMS dagidek tizim kalitlari qiymati va faoliyat holatini boshqarish." />
    <CrudSection<SystemSettingRecord, UpdateSystemSettingRequest>
      title="Sozlamalar"
      items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={canWrite} allowCreate={false} allowDelete={false}
      getId={(item) => item.id} getName={(item) => item.key}
      search={(item) => `${item.key} ${item.value}`}
      searchPlaceholder="Sozlama yoki qiymat bo'yicha qidirish..."
      columns={[
        { header: "Sozlama", cell: (item) => <span className="font-mono text-xs">{item.key}</span> },
        { header: "Qiymat", cell: (item) => <span className="font-medium">{item.value}</span> },
        { header: "Holati", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Faol emas"}</Badge> },
      ]}
      blankForm={empty} toForm={(item) => ({ value: item.value, active: item.active })}
      validate={(form) => !form.value.trim() ? "Qiymat majburiy" : null}
      onCreate={async () => undefined}
      onUpdate={(id, form) => updateSystemSetting(id, form).then(() => undefined)}
      onDelete={async () => undefined}
      renderForm={(form, set) => <div className="grid gap-4">
        <div className="space-y-1.5"><Label>Qiymat *</Label><Input value={form.value} onChange={(event) => set({ value: event.target.value })} placeholder="Qiymatni kiriting" /></div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={(active) => set({ active })} /></div>
      </div>}
    />
  </div>;
}

export function AdminSystemLanguages() {
  const data = useCrudData<SystemLanguageRecord>(["system-languages"], listSystemLanguages);
  const empty = (): SystemLanguageRecord => ({ id: 0, code: "", name: "", active: true, sortOrder: 0 });

  return <div className="space-y-6 p-3 sm:p-6">
    <PageHeader title="Tillar" description="Tarjima tizimida ishlatiladigan beshta standart til." />
    <CrudSection<SystemLanguageRecord, SystemLanguageRecord>
      title="Tillar"
      items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={false} getId={(item) => item.id} getName={(item) => item.name}
      search={(item) => `${item.code} ${item.name}`}
      columns={[
        { header: "Kod", cell: (item) => <span className="font-mono text-xs">{item.code}</span> },
        { header: "Nomi", cell: (item) => <span className="font-medium">{item.name}</span> },
        { header: "Holati", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Faol emas"}</Badge> },
      ]}
      blankForm={empty} toForm={(item) => ({ ...item })}
      onCreate={async () => undefined} onUpdate={async () => undefined} onDelete={async () => undefined}
      renderForm={() => null}
    />
  </div>;
}

const emptyTranslation = (): SaveTranslationMessageRequest => ({ key: "", category: "CRM", active: true, translations: emptyTranslations() });

export function AdminTranslationMessages() {
  const { user } = useAuth();
  const data = useCrudData<TranslationMessageRecord>(["translation-messages"], listTranslationMessages);
  const canWrite = hasAuthority(user, "USER_MANAGE");

  return <div className="space-y-6 p-3 sm:p-6">
    <PageHeader title="Tarjimalar" description="CRM va shaxsiy kabinet xabarlari uchun besh tilli tarjima kalitlari." />
    <CrudSection<TranslationMessageRecord, SaveTranslationMessageRequest>
      title="Tarjimalar"
      items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={canWrite} getId={(item) => item.id} getName={(item) => item.key}
      search={(item) => `${item.key} ${item.category} ${Object.values(item.translations).join(" ")}`}
      searchPlaceholder="Kalit, toifa yoki xabar bo'yicha qidirish..."
      columns={[
        { header: "Kalit", cell: (item) => <span className="font-medium">{item.key}</span> },
        { header: "Toifa", cell: (item) => <Badge variant="outline">{item.category.toLowerCase()}</Badge> },
        { header: "Xabar", cell: (item) => item.message },
        { header: "Tarjimalar", cell: (item) => <span className="text-sm text-muted-foreground">{Object.values(item.translations).filter((value) => value.trim()).length}/5 til</span> },
        { header: "Holati", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Faol emas"}</Badge> },
      ]}
      blankForm={emptyTranslation}
      toForm={(item) => ({ key: item.key, category: item.category, active: item.active, translations: { ...item.translations } })}
      validate={(form) => !form.key.trim() ? "Kalit majburiy" : !form.translations.uzLatin.trim() ? "O'zbekcha qiymat majburiy" : null}
      onCreate={(form) => createTranslationMessage(form).then(() => undefined)}
      onUpdate={(id, form) => updateTranslationMessage(id, form).then(() => undefined)}
      onDelete={deleteTranslationMessage}
      renderForm={(form, set) => <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Kalit *</Label><Input value={form.key} onChange={(event) => set({ key: event.target.value })} placeholder="Kalitni kiriting" /></div>
          <div className="space-y-1.5"><Label>Toifa *</Label><Select value={form.category} onValueChange={(category) => set({ category: category as TranslationCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CRM">crm</SelectItem><SelectItem value="CABINET">cabinet</SelectItem></SelectContent></Select></div>
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={(active) => set({ active })} /></div>
        <TranslationInputs value={form.translations} onChange={(translations) => set({ translations })} />
      </div>}
    />
  </div>;
}
