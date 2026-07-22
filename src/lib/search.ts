// Text folding for every search box in the app.
//
// The people in this database are named Özdemir, Gül, Şahin, Çetin. The people
// typing those names into a search box are doing it on a phone keyboard that
// is often set to Dutch, where ö and ü take a long-press and ş and ç aren't
// there at all. So "ozdemir" has to find Özdemir, and "gul" has to find Gül —
// otherwise the search box quietly reports that half the school doesn't exist.
//
// Unicode NFD splits a precomposed ö into o + U+0308, which the combining-mark
// range then strips. Turkish ı/İ and the Dutch ij are handled separately
// because they don't decompose: ı is its own letter, not a dotless-marked i.
const COMBINING = /[̀-ͯ]/g;

export function fold(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    // İ decomposes to I + dot-above, which the strip below turns into I; ı has
    // no decomposition at all. Mapping both to i first makes the two Turkish
    // i's and the Latin i a single letter for search purposes.
    .replace(/[İIı]/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING, '')
    // ß and the Turkish/German leftovers that NFD doesn't touch.
    .replace(/ß/g, 'ss')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae');
}

// Whether `query` occurs in `haystack`, ignoring case and diacritics.
// Empty queries match everything, which is what every caller wants for an
// untouched search box.
export function matches(haystack: unknown, query: string): boolean {
  const q = fold(query).trim();
  if (!q) return true;
  return fold(haystack).includes(q);
}

// Convenience for the common "does any of these fields match" filter.
export function matchesAny(fields: unknown[], query: string): boolean {
  const q = fold(query).trim();
  if (!q) return true;
  return fields.some((f) => fold(f).includes(q));
}
