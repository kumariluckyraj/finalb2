export function readStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function writeStringArray(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
}

export function toggleStringArrayItem(key: string, value: string, limit = 20): string[] {
  const current = readStringArray(key);
  const next = current.includes(value) ? current.filter((item) => item !== value) : [value, ...current];
  const trimmed = next.slice(0, limit);
  writeStringArray(key, trimmed);
  return trimmed;
}

export function upsertRecentSearch(key: string, value: string, limit = 8): string[] {
  const trimmed = value.trim();
  if (!trimmed) return readStringArray(key);
  const current = readStringArray(key).filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...current].slice(0, limit);
  writeStringArray(key, next);
  return next;
}
