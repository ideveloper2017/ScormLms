import { useQuery } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listFaculties, listGroups, listPrograms } from "@/lib/academic-api";
import { qk } from "@/lib/query-keys";

type Kind = "faculty" | "program" | "group";

const QUERY_CONFIG: Record<Kind, { key: () => readonly string[]; fn: () => Promise<{ name: string }[]> }> = {
  faculty: { key: qk.faculties, fn: listFaculties as () => Promise<{ name: string }[]> },
  program: { key: qk.programs,  fn: listPrograms  as () => Promise<{ name: string }[]> },
  group:   { key: qk.groups,    fn: listGroups    as () => Promise<{ name: string }[]> },
};

/**
 * Akademik jadvaldan nom tanlovchi dropdown.
 * Tanlangan qiymat NOM (string) sifatida saqlanadi — shuning uchun mavjud
 * string maydonlar (User.faculty/direction/groupName, Student.*) bilan mos.
 * Ro'yxatda yo'q eski qiymatlar ham ko'rsatiladi (ma'lumot yo'qolmasligi uchun).
 */
export function AcademicSelect({
  kind, value, onChange, placeholder,
}: {
  kind: Kind;
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}) {
  const cfg = QUERY_CONFIG[kind];
  const { data = [] } = useQuery({
    queryKey: cfg.key(),
    queryFn: cfg.fn,
    staleTime: 60_000,
  });

  const names = (data as { name: string }[]).map((r) => r.name).filter(Boolean) as string[];
  const options = value && !names.includes(value) ? [value, ...names] : names;

  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger><SelectValue placeholder={placeholder ?? "Tanlang"} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Tanlanmagan —</SelectItem>
        {options.map((n) => (
          <SelectItem key={n} value={n}>{n}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}