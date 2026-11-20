/** Normalize text for accent-insensitive, case-insensitive filtering. */
export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

export function matchesSearchText(value: string | null | undefined, query: string | null | undefined): boolean {
  const normalizedQuery = normalizeSearchText(query).trim();
  return !normalizedQuery || normalizeSearchText(value).includes(normalizedQuery);
}
