import { useEffect, useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listFaculties, listGroups, listPrograms } from "@/lib/academic-api";

type Kind = "faculty" | "program" | "group";

const LOADERS: Record<Kind, () => Promise<{ name: string }[]>> = {
  faculty: listFaculties,
  program: listPrograms,
  group: listGroups,
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
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    LOADERS[kind]()
      .then((rows) => setNames(rows.map((r) => r.name).filter(Boolean)))
      .catch(() => setNames([]));
  }, [kind]);

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
