export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function trigramSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a)
  const nb = normalizeTitle(b)
  if (na === nb) return 1.0
  if (!na || !nb) return 0

  const trigrams = new Set<string>()
  for (let i = 0; i < na.length - 2; i++) trigrams.add(na.slice(i, i + 3))
  let matches = 0
  for (let i = 0; i < nb.length - 2; i++) {
    if (trigrams.has(nb.slice(i, i + 3))) matches++
  }
  const total = trigrams.size + nb.length - 2
  return total > 0 ? (2 * matches) / total : 0
}

export const ANILIST_TO_ANILIBERTY_TYPE: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV',
  MOVIE: 'MOVIE',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: 'SPECIAL',
  WEB: 'WEB',
}

export const ANILIBERTY_SEASONS: Record<string, string> = {
  winter: 'winter',
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
}

export const SORT_OPTIONS = [
  'FRESH_AT_DESC',
  'FRESH_AT_ASC',
  'RATING_DESC',
  'RATING_ASC',
  'YEAR_DESC',
  'YEAR_ASC',
] as const
