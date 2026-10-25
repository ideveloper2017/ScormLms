import { useMemo } from "react";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DepartmentRecord } from "@/lib/academic-api";
import { COMMON_DEPARTMENT_LABEL, groupDepartments, isCommonDepartment } from "@/lib/departments";

/** Jadval katagi: fakultet nomi yoki "Umumiy kafedra" belgisi. */
export function DepartmentFacultyCell({ department }: { department: DepartmentRecord }) {
  return isCommonDepartment(department)
    ? <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">{COMMON_DEPARTMENT_LABEL}</Badge>
    : <span>{department.facultyName ?? "—"}</span>;
}

interface DepartmentSelectProps {
  departments: DepartmentRecord[];
  value: number | null;
  onChange: (value: number | null) => void;
  noneLabel?: string;
}

/** Istalgan kafedrani tanlash: umumiy kafedralar va barcha fakultet kafedralari guruhlab ko'rsatiladi. */
export function DepartmentSelect({ departments, value, onChange, noneLabel = "— Tanlanmagan —" }: DepartmentSelectProps) {
  const { common, faculties } = useMemo(() => groupDepartments(departments), [departments]);
  return (
    <Select
      value={value != null ? String(value) : "none"}
      onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
    >
      <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{noneLabel}</SelectItem>
        {common.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Umumiy kafedralar</SelectLabel>
              {common.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
        {faculties.map(([faculty, items]) => (
          <SelectGroup key={faculty}>
            <SelectSeparator />
            <SelectLabel>{faculty}</SelectLabel>
            {items.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
