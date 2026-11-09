import type { ElementType } from "react";

export interface SearchableNavItem {
  name: string;
  href: string;
  icon?: ElementType;
}

export interface SearchableNavGroup {
  label: string;
  href?: string;
  icon?: ElementType;
  items: SearchableNavItem[];
}

export interface NavSearchResult {
  name: string;
  href: string;
  icon?: ElementType;
  /** Havola qaysi bo'limda turgani (bo'limning o'zi topilgan bo'lsa bo'sh) */
  group: string;
}

/** Katta-kichik harf va turli apostroflar (o', oʻ, o’, o`) farqini yo'qotadi. */
export function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[ʻʼ’‘`´']/g, "'").replace(/\s+/g, " ").trim();
}

/** Menyudagi barcha havolalar soni (bo'lim o'zi havola bo'lsa u ham hisoblanadi). */
export function countNavLinks(groups: SearchableNavGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length + (group.href ? 1 : 0), 0);
}

/**
 * Menyu tuzilmasini o'zgartirmasdan qidiradi: sahifa nomi yoki bo'lim nomi mos kelsa qaytaradi.
 * Bo'sh so'rov uchun `null` — bu holda odatdagi menyu ko'rsatiladi.
 */
export function searchNav(groups: SearchableNavGroup[], query: string): NavSearchResult[] | null {
  const needle = normalizeSearchText(query);
  if (!needle) return null;

  const results: NavSearchResult[] = [];
  const seen = new Set<string>();
  const add = (result: NavSearchResult) => {
    const key = `${result.href}|${result.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(result);
  };

  for (const group of groups) {
    const groupMatches = normalizeSearchText(group.label).includes(needle);
    if (group.href && groupMatches) add({ name: group.label, href: group.href, icon: group.icon, group: "" });
    for (const item of group.items) {
      if (groupMatches || normalizeSearchText(item.name).includes(needle)) {
        add({ name: item.name, href: item.href, icon: item.icon, group: group.label });
      }
    }
  }
  return results;
}
