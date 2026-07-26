import { fetchAniliberty } from '../lib/aniliberty'
import { enrichBatch, jsonResponse, type AnilibertyRelease, type EnrichedRelease } from '../lib/enrich'
import type { Env } from '../types'

type SectionName = 'trending' | 'ongoing' | 'top-rated' | 'upcoming'

const SECTION_TTL: Record<SectionName, number> = {
  trending: 1800,
  ongoing: 1800,
  'top-rated': 3600,
  upcoming: 3600,
}

interface CatalogResponse {
  data: AnilibertyRelease[]
  meta: { pagination: unknown }
}

async function fetchCatalog(
  params: string,
  env: Env,
  ttl: number,
): Promise<AnilibertyRelease[]> {
  const res = await fetchAniliberty<CatalogResponse>(
    `/anime/catalog/releases?${params}`,
    env,
    ttl,
  )
  return res.data
}

function buildSectionUrl(name: SectionName): string {
  const base = 'limit=10&include=id,alias,name,type,year,poster,episodes_total,is_ongoing,is_in_production,fresh_at,season,age_rating,genres,description'
  switch (name) {
    case 'trending':
      return `f[sorting]=FRESH_AT_DESC&${base}`
    case 'ongoing':
      return `f[publish_statuses]=IS_ONGOING&f[sorting]=FRESH_AT_DESC&${base}`
    case 'top-rated':
      return `limit=50&f[sorting]=FRESH_AT_DESC&include=id,alias,name,type,year,poster,episodes_total,is_ongoing,is_in_production,fresh_at,season,age_rating,genres,description`
    case 'upcoming':
      return `f[production_statuses]=IS_IN_PRODUCTION&f[sorting]=FRESH_AT_DESC&${base}`
  }
}

async function trendingHandler(env: Env): Promise<Response> {
  const cacheKey = 'aniday:section:trending'
  const cached = await env.CACHE.get(cacheKey)
  if (cached) return jsonResponse(JSON.parse(cached))

  const releases = await fetchCatalog(buildSectionUrl('trending'), env, SECTION_TTL.trending)
  const enriched = await enrichBatch(releases, env)

  await env.CACHE.put(cacheKey, JSON.stringify(enriched), { expirationTtl: SECTION_TTL.trending })
  return jsonResponse(enriched)
}

async function ongoingHandler(env: Env): Promise<Response> {
  const cacheKey = 'aniday:section:ongoing'
  const cached = await env.CACHE.get(cacheKey)
  if (cached) return jsonResponse(JSON.parse(cached))

  const releases = await fetchCatalog(buildSectionUrl('ongoing'), env, SECTION_TTL.ongoing)
  const enriched = await enrichBatch(releases, env)

  await env.CACHE.put(cacheKey, JSON.stringify(enriched), { expirationTtl: SECTION_TTL.ongoing })
  return jsonResponse(enriched)
}

async function topRatedHandler(env: Env): Promise<Response> {
  const cacheKey = 'aniday:section:top-rated'
  const cached = await env.CACHE.get(cacheKey)
  if (cached) return jsonResponse(JSON.parse(cached))

  const releases = await fetchCatalog(buildSectionUrl('top-rated'), env, SECTION_TTL['top-rated'])
  const enriched = await enrichBatch(releases, env)

  const withScores = enriched
    .filter((r): r is EnrichedRelease & { anilist: NonNullable<EnrichedRelease['anilist']> } =>
      r.anilist?.averageScore != null
    )
    .sort((a, b) => b.anilist.averageScore! - a.anilist.averageScore!)
    .slice(0, 10)

  if (withScores.length >= 5) {
    await env.CACHE.put(cacheKey, JSON.stringify(withScores), { expirationTtl: SECTION_TTL['top-rated'] })
    return jsonResponse(withScores)
  }

  const fallback = await fetchCatalog('limit=10&f[sorting]=RATING_DESC&include=id,alias,name,type,year,poster,episodes_total,is_ongoing,is_in_production,fresh_at,season,age_rating,genres,description', env, SECTION_TTL['top-rated'])
  const fallbackEnriched = await enrichBatch(fallback, env)
  await env.CACHE.put(cacheKey, JSON.stringify(fallbackEnriched), { expirationTtl: SECTION_TTL['top-rated'] })
  return jsonResponse(fallbackEnriched)
}

async function upcomingHandler(env: Env): Promise<Response> {
  const cacheKey = 'aniday:section:upcoming'
  const cached = await env.CACHE.get(cacheKey)
  if (cached) return jsonResponse(JSON.parse(cached))

  const releases = await fetchCatalog(buildSectionUrl('upcoming'), env, SECTION_TTL.upcoming)
  const enriched = await enrichBatch(releases, env)

  await env.CACHE.put(cacheKey, JSON.stringify(enriched), { expirationTtl: SECTION_TTL.upcoming })
  return jsonResponse(enriched)
}

const handlers: Record<SectionName, (env: Env) => Promise<Response>> = {
  trending: trendingHandler,
  ongoing: ongoingHandler,
  'top-rated': topRatedHandler,
  upcoming: upcomingHandler,
}

export async function sectionsHandler(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url)
  const section = url.pathname.replace('/api/v1/sections/', '') as SectionName

  const handler = handlers[section]
  if (!handler) {
    return jsonResponse({ error: 'Unknown section' }, 404)
  }

  return handler(env)
}
