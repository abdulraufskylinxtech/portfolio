const LATIN_LOCALES = new Set(["en", "de"]);

export function getNameInitials(name: string, locale: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  const initials =
    parts.length >= 2
      ? `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`
      : name.slice(0, 2);

  return LATIN_LOCALES.has(locale) ? initials.toUpperCase() : initials;
}
