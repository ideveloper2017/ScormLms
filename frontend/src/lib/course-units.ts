export const UNASSIGNED_UNIT_TITLE = "Modulga biriktirilmagan darslar";

/**
 * Kurs darslarini modullar bo'yicha guruhlaydi (modul -> dars -> material): modullar o'z tartibida, bo'sh modul ham
 * ko'rinadi, modulga biriktirilmagan darslar oxirida. Kursda modul bo'lmasa — bitta sarlavhasiz guruh.
 */
export function groupByUnit<U extends { id: number; title: string }, T>(
  units: U[], items: T[], unitIdOf: (item: T) => number | null | undefined,
) {
  if (units.length === 0) return [{ unit: null as U | null, title: null as string | null, items }];
  const known = new Set(units.map((unit) => unit.id));
  const groups = units.map((unit) => ({
    unit: unit as U | null, title: unit.title as string | null, items: items.filter((item) => unitIdOf(item) === unit.id),
  }));
  const loose = items.filter((item) => !known.has(unitIdOf(item) ?? -1));
  if (loose.length) groups.push({ unit: null, title: UNASSIGNED_UNIT_TITLE, items: loose });
  return groups;
}
