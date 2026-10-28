import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { academicPeriodApi } from "@/services/api/academic-period-api";

/**
 * O'quv yilini ro'yxatdan tanlash ("O'quv davrlari" ma'lumotnomasidan) — "2025-2026" kabi qo'lda yozish shart emas.
 * Bo'sh qiymat ruxsat etilmasa, joriy o'quv yili avtomatik tanlanadi.
 */
export function AcademicYearSelect({ value, onChange, id, className, disabled, emptyLabel, "aria-label": ariaLabel }: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  /** Berilsa bo'sh tanlov ham bor (masalan "Barcha yillar") */
  emptyLabel?: string;
  "aria-label"?: string;
}) {
  const years = useQuery({ queryKey: ["academic-periods", "years"], queryFn: () => academicPeriodApi.listYears(false) });
  const current = years.data?.find((year) => year.current) ?? years.data?.[0];
  useEffect(() => {
    if (!value && emptyLabel === undefined && current && !disabled) onChange(current.code);
  }, [current, disabled, emptyLabel, onChange, value]);
  const codes = (years.data ?? []).map((year) => year.code);

  return (
    <select id={id} aria-label={ariaLabel} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}
      className={cn("h-10 w-full rounded-md border bg-background px-3 text-sm", className)}>
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {emptyLabel === undefined && !value && <option value="">{years.isLoading ? "Yuklanmoqda..." : "O'quv yilini tanlang"}</option>}
      {value && !codes.includes(value) && <option value={value}>{value}</option>}
      {(years.data ?? []).map((year) => (
        <option key={year.code} value={year.code}>{year.code}{year.current ? " · joriy" : ""}</option>
      ))}
    </select>
  );
}
