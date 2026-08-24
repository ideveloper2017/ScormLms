import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  createUniversity,
  deleteUniversity,
  listUniversities,
  updateUniversity,
  type SaveUniversityRequest,
  type UniversityLanguage,
  type UniversityRecord,
} from "@/services/api/university-api";

const languageLabels: Record<UniversityLanguage, string> = {
  EN: "English",
  UZ_LATIN: "O'zbekcha",
  KAA: "Qaraqalpaqsha",
  RU: "Русский",
  UZ_CYRILLIC: "Ўзбекча",
};

const emptyUniversity = (): SaveUniversityRequest => ({
  name: "",
  rector: "",
  address: "",
  defaultLanguage: "UZ_LATIN",
  phone: "+998",
  bankDetails: "",
  chiefAccountant: "",
  legalCounsel: "",
  active: true,
});

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>;
}

export function AdminUniversities() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const universities = useCrudData<UniversityRecord>(["universities"], listUniversities);

  return <div className="space-y-6 p-3 sm:p-6">
    <div>
      <h1 className="text-2xl font-bold">Universitetlar</h1>
      <p className="text-sm text-muted-foreground">Universitet rekvizitlari, rahbariyati, standart tili va faoliyat holatini boshqaring.</p>
    </div>
    <CrudSection<UniversityRecord, SaveUniversityRequest>
      title="Universitetlar ro'yxati"
      description="Referens boshqaruv panelidagi universitet reyestri maydonlariga mos katalog."
      items={universities.items}
      loading={universities.loading}
      error={universities.error}
      onReload={universities.reload}
      canWrite={canWrite}
      getId={(item) => item.id}
      getName={(item) => item.name}
      search={(item) => `${item.name} ${item.rector} ${item.address} ${item.phone}`}
      searchPlaceholder="Nomi, rektor yoki manzil bo'yicha qidirish..."
      columns={[
        { header: "Nomi", cell: (item) => <span className="font-medium">{item.name}</span> },
        { header: "Holati", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Nofaol"}</Badge> },
        { header: "Rektor", cell: (item) => item.rector },
        { header: "Standart til", cell: (item) => languageLabels[item.defaultLanguage] },
        { header: "Manzil", cell: (item) => item.address },
      ]}
      blankForm={emptyUniversity}
      toForm={(item) => ({
        name: item.name,
        rector: item.rector,
        address: item.address,
        defaultLanguage: item.defaultLanguage,
        phone: item.phone,
        bankDetails: item.bankDetails,
        chiefAccountant: item.chiefAccountant,
        legalCounsel: item.legalCounsel,
        active: item.active,
      })}
      validate={(form) => {
        if (form.name.trim().length < 3) return "Universitet nomi majburiy";
        if (form.rector.trim().length < 3) return "Rektor F.I.O. majburiy";
        if (form.address.trim().length < 3) return "Manzil majburiy";
        if (!/^\+?[0-9\s()-]{9,20}$/.test(form.phone.trim())) return "Telefon raqami noto'g'ri";
        if (form.bankDetails.trim().length < 3) return "Bank rekvizitlari majburiy";
        if (form.chiefAccountant.trim().length < 3) return "Bosh hisobchi F.I.O. majburiy";
        if (form.legalCounsel.trim().length < 3) return "Yuristkonsult F.I.O. majburiy";
        return null;
      }}
      onCreate={(form) => createUniversity(form).then(() => undefined)}
      onUpdate={(id, form) => updateUniversity(id, form).then(() => undefined)}
      onDelete={deleteUniversity}
      renderForm={(form, set) => <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
        <Field label="Nomi *" wide><Input value={form.name} onChange={(event) => set({ name: event.target.value })} placeholder="Universitet nomini kiriting" /></Field>
        <Field label="Rektor *"><Input value={form.rector} onChange={(event) => set({ rector: event.target.value })} placeholder="Rektorning F.I.O." /></Field>
        <Field label="Standart til *"><Select value={form.defaultLanguage} onValueChange={(value) => set({ defaultLanguage: value as UniversityLanguage })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(languageLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Manzil *" wide><Textarea value={form.address} onChange={(event) => set({ address: event.target.value })} placeholder="Manzilni kiriting" /></Field>
        <Field label="Universitet telefon raqami *"><Input value={form.phone} onChange={(event) => set({ phone: event.target.value })} placeholder="+998901234567" /></Field>
        <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={(active) => set({ active })} /></div>
        <Field label="Bank rekvizitlari *" wide><Textarea value={form.bankDetails} onChange={(event) => set({ bankDetails: event.target.value })} placeholder="Bank rekvizitlari" /></Field>
        <Field label="Bosh hisobchi *"><Input value={form.chiefAccountant} onChange={(event) => set({ chiefAccountant: event.target.value })} placeholder="Bosh hisobchi F.I.O." /></Field>
        <Field label="Yuristkonsult *"><Input value={form.legalCounsel} onChange={(event) => set({ legalCounsel: event.target.value })} placeholder="Yuristkonsult F.I.O." /></Field>
      </div>}
    />
  </div>;
}
