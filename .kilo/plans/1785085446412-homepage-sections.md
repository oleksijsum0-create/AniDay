# Homepage — 4 section categories

## Goal
Add 4 content sections to the homepage below the existing "Latest releases" grid. Each section has a header (Ukrainian + English title) and a horizontal scrollable row of AnimeCards.

## Sections & data sources

| Section | Source | AniLiberty params | Cache TTL |
|---|---|---|---|
| **Popularne zaras / Trending** — most recently updated entries (proxy for "hot right now") | `GET /anime/catalog/releases` | `sorting=FRESH_AT_DESC`, limit=10 | 1800s |
| **Нові серії / Ongoing** — currently airing seasonal titles sorted by latest episode | `GET /anime/catalog/releases` | `f[publish_statuses]=IS_ONGOING`, `sorting=FRESH_AT_DESC`, limit=10 | 1800s |
| **Найкраще оцінене / Top Rated** — highest AniList averageScore | `GET /anime/catalog/releases` (fetch 50), enrich via D1 + AniList, sort by `averageScore` desc, return top 10 | `sorting=FRESH_AT_DESC`, limit=50 (larger batch for sorting) | 3600s |
| **Скоро вийде / Upcoming** — announced/in-production titles | `GET /anime/catalog/releases` | `f[production_statuses]=IS_IN_PRODUCTION`, `sorting=FRESH_AT_DESC`, limit=10 | 3600s |

For **Top Rated**, when D1 `title_links` returns no matches (matching job hasn't run yet), fallback: return catalog with `sorting=RATING_DESC` directly (no AniList data).

## Worker API changes

**File: `apps/workers/api/src/routes/sections.ts`** — new route file

Exports a single `sectionsHandler` that dispatches on path:
- `GET /api/v1/sections/trending`
- `GET /api/v1/sections/ongoing`
- `GET /api/v1/sections/top-rated`
- `GET /api/v1/sections/upcoming`

Each handler:
1. Calls `fetchAniliberty` with appropriate catalog params
2. Extracts `.data` from the catalog response (which is `{ data: [...], meta: {...} }`)
3. Calls the shared enrichment pipeline (D1 title_links lookup + batch AniList GraphQL — already exists in `releases.ts`)
4. Returns JSON array of enriched releases

Shared enrichment extraction: move `getTitleLinks` + `fetchAnilistBatch` to a new `lib/enrich.ts` so both `releases.ts` and `sections.ts` share them.

For **top-rated** specifically:
- Fetch 50 releases from catalog
- Enrich via the shared pipeline
- Filter out entries without `anilist.averageScore`
- Sort descending by `averageScore`
- Take first 10
- If enriched list < 5 after filtering (title_links empty), fallback: re-fetch with `sorting=RATING_DESC`, limit=10, return raw

**File: `apps/workers/api/src/index.ts`**
- Import `sectionsHandler`
- Add routes: `router.get('/api/v1/sections/:section', sectionsHandler)`

## Frontend changes

**File: `apps/web/src/lib/api/client.ts`**
- Add `getSection(sectionName): Promise<EnrichedRelease[]>` function

**File: `apps/web/src/lib/api/sections.ts`** — new file
- `useSection(sectionName: 'trending' | 'ongoing' | 'top-rated' | 'upcoming')` — TanStack Query hook

**File: `apps/web/src/app/page.tsx`** — restructured
- Remove the old `Latest releases` header+grid
- Keep header (AniDay title + subtitle)
- Render 5 sections total: Latest releases (already exists), Trending, Ongoing, Top Rated, Upcoming
- Each section is a `<section>` with:
  - Section header: `<h2>` with Golos Text font, 18px bold, #eeecdd title + muted #a09e93 subtitle underneath
  - Scrollable row: `<div className="flex gap-5 overflow-x-auto pb-2">` containing `AnimeCard` components (no rank badge for section cards, or keep it)
  - Loading state: horizontal row of skeleton cards
  - Empty state: muted text "No data yet"

**Section header examples:**
- "Популярне зараз" / "Trending"
- "Нові серії" / "Ongoing"
- "Найкраще оцінене" / "Top Rated"
- "Скоро вийде" / "Upcoming"

Styling: same font vars `var(--font-golos)`, colors `#eeecdd` / `#a09e93`, no new CSS needed.

## Styling conventions

- Section `<h2>`: `font-[family-name:var(--font-golos)] text-[18px] font-bold tracking-[-0.5px] text-[#eeecdd]`
- Subtitle `<p>`: `text-[13px] font-medium tracking-[-0.3px] text-[#a09e93] mt-[-2px]`
- Row container: `flex gap-5 overflow-x-auto pb-2` with custom scrollbar hidden (or default browser)
- Skeleton card: same `h-[299px] w-[190px] animate-pulse rounded-[12px] bg-[#1e1b19]` as existing

## No CSS changes needed

All colors and fonts already defined in `globals.css`. Use inline Tailwind classes matching existing AnimeCard style.

## Risks & edge cases

- **D1 title_links empty** → Top Rated falls back to AniLiberty RATING_DESC. Other sections still work (just without AniList enrichment).
- **AniLiberty rate limits** → handled by existing `fetchAniliberty` with KV cache
- **Large catalog response (top-rated fetches 50)** → KV cached for 3600s, only 1 extra fetch
- **Empty sections** (e.g. no upcoming titles) → show muted "No data yet" text
