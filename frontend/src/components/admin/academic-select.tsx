import { useQuery } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listFaculties, listGroups, listPrograms } from "@/lib/academic-api";
import { qk } from "@/lib/query-keys";

type Kind = "faculty" | "program" | "group";
type AcademicOption = { id?: number; name: string };

const QUERY_CONFIG: Record<Kind, { key: () => readonly string[]; fn: () => Promise<AcademicOption[]> }> = {
  faculty: { key: qk.faculties, fn: listFaculties },
  program: { key: qk.programs,  fn: () => listPrograms() },
  group:   { key: qk.groups,    fn: () => listGroups() },
};

/**
 * Akademik jadvaldan nom tanlovchi dropdown.
 * Tanlangan qiymat NOM (string) sifatida saqlanadi — shuning uchun mavjud
 * string maydonlar (User.faculty/direction/groupName, Student.*) bilan mos.
 * Ro'yxatda yo'q eski qiymatlar ham ko'rsatiladi (ma'lumot yo'qolmasligi uchun).
 */
export function AcademicSelect({
  kind, value, onChange, placeholder, valueMode = "name",
}: {
  kind: Kind;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  valueMode?: "name" | "id";
}) {
  const cfg = QUERY_CONFIG[kind];
  const { data = [] } = useQuery({
    queryKey: cfg.key(),
    queryFn: cfg.fn,
    staleTime: 60_000,
  });

  const options = data.map((record) => ({
    value: valueMode === "id" ? String(record.id ?? "") : record.name,
    label: record.name,
  })).filter((option) => option.value);
  const visibleOptions = value && !options.some((option) => option.value === value)
    ? [{ value, label: value }, ...options]
    : options;

  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger><SelectValue placeholder={placeholder ?? "Tanlang"} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Tanlanmagan —</SelectItem>
        {visibleOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
