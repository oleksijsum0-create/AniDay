import type { Env } from './types'

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function trigramSimilarity(a: string, b: string): number {
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

function formatMap(anilistFormat: string): string {
  const map: Record<string, string> = {
    TV: 'TV',
    TV_SHORT: 'TV',
    MOVIE: 'MOVIE',
    OVA: 'OVA',
    ONA: 'ONA',
    SPECIAL: 'SPECIAL',
    WEB: 'WEB',
  }
  return map[anilistFormat] ?? anilistFormat
}

interface AnilibertyRelease {
  id: number
  type: { value: string }
  year: number
  name: { main: string; english: string; alternative: string }
  episodes_total: number
  alias: string
}

interface AnilistCandidate {
  id: number
  idMal: number | null
  title: { romaji: string; english: string; native: string }
  format: string
  episodes: number | null
  seasonYear: number
  synonyms: string[]
}

async function fetchLatestReleases(
  baseUrl: string,
): Promise<AnilibertyRelease[]> {
  const res = await fetch(`${baseUrl}/anime/releases/latest?limit=50`)
  const data: { data: AnilibertyRelease[] } = await res.json()
  return data.data
}

async function searchAnilist(
  title: string,
): Promise<AnilistCandidate[]> {
  const query = `
    query ($search: String!) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: ANIME) {
          id idMal title { romaji english native }
          format episodes seasonYear synonyms
        }
      }
    }
  `
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { search: title } }),
  })

  if (res.status === 429) {
    console.log('AniList 429, skipping')
    return []
  }

  const data: { data?: { Page?: { media: AnilistCandidate[] } } } =
    await res.json()
  return data.data?.Page?.media ?? []
}

function findBestMatch(
  aliRelease: AnilibertyRelease,
  candidates: AnilistCandidate[],
): { anilistId: number; malId: number | null; confidence: number } | null {
  const aliNames = [
    aliRelease.name.main,
    aliRelease.name.english,
    ...(aliRelease.name.alternative?.split(/[,/]/).map(s => s.trim()) ?? []),
  ].filter(Boolean)

  let bestScore = 0
  let bestMatch: { anilistId: number; malId: number | null; confidence: number } | null = null

  for (const c of candidates) {
    const anilistNames = [
      c.title.romaji,
      c.title.english,
      c.title.native,
      ...(c.synonyms ?? []),
    ].filter(Boolean)

    let maxTextScore = 0
    for (const aName of anilistNames) {
      for (const lName of aliNames) {
        const score = trigramSimilarity(aName, lName)
        if (score > maxTextScore) maxTextScore = score
      }
    }

    let confidence = maxTextScore

    const yearMatch = c.seasonYear === aliRelease.year
    const yearClose = Math.abs(c.seasonYear - aliRelease.year) <= 1
    const formatMatch = formatMap(c.format) === aliRelease.type?.value
    const episodeMatch =
      c.episodes != null &&
      aliRelease.episodes_total != null &&
      c.episodes === aliRelease.episodes_total

    if (yearMatch) confidence += 0.2
    else if (yearClose) confidence += 0.1
    else confidence -= 0.3

    if (formatMatch) confidence += 0.1
    if (episodeMatch) confidence += 0.1

    if (confidence > bestScore) {
      bestScore = confidence
      bestMatch = {
        anilistId: c.id,
        malId: c.idMal,
        confidence: Math.round(confidence * 100) / 100,
      }
    }
  }

  return bestMatch
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Send POST to trigger matching', { status: 405 })
    }

    const url = env.ANILIBERTY_BASE_URL
    const releases = await fetchLatestReleases(url)
    let matched = 0
    let skipped = 0

    for (const release of releases) {
      const existing = await env.DB.prepare(
        'SELECT aniliberty_id FROM title_links WHERE aniliberty_id = ?',
      )
        .bind(release.id)
        .first()

      if (existing) {
        skipped++
        continue
      }

      const candidates = await searchAnilist(release.name.main)
      if (candidates.length === 0) {
        const enCandidates = await searchAnilist(release.name.english)
        candidates.push(...enCandidates)
      }

      if (candidates.length === 0) continue

      const match = findBestMatch(release, candidates)

      if (match && match.confidence >= 0.7) {
        await env.DB.prepare(
          `INSERT INTO title_links (aniliberty_id, anilist_id, mal_id, confidence, method, aniliberty_name, anilist_name)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            release.id,
            match.anilistId,
            match.malId,
            match.confidence,
            match.confidence >= 0.9 ? 'fuzzy' : 'fuzzy_low',
            release.name.main,
            release.alias,
          )
          .run()
        matched++
      }

      await new Promise(r => setTimeout(r, 300))
    }

    return new Response(
      JSON.stringify({ matched, skipped, total: releases.length }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  },
} satisfies ExportedHandler<Env>
