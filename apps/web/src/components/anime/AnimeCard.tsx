import Link from 'next/link'
import type { EnrichedRelease } from '@/types/release'

function posterUrl(release: EnrichedRelease): string {
  const poster = release.poster
  if (typeof poster === 'object' && poster !== null) {
    const p = poster as { optimized?: { preview?: string }; preview?: string }
    const raw = p.optimized?.preview ?? p.preview ?? ''
    return raw ? `https://aniliberty.top${raw.replace(/\(jpg\|webp\)/, 'jpg')}` : ''
  }
  return ''
}

function displayName(release: EnrichedRelease): string {
  return release.name.main || release.name.english || release.alias
}

export function AnimeCard({ release }: { release: EnrichedRelease }) {
  const cover = release.anilist?.coverImage?.extraLarge ?? posterUrl(release)
  const rating = release.anilist?.averageScore
  const typeLabel = release.type?.description ?? release.type?.value ?? ''

  return (
    <Link
      href={`/anime/${release.alias}`}
      className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-all hover:shadow-lg"
    >
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={displayName(release)}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm p-2 text-center">
            {displayName(release)}
          </div>
        )}
      </div>
      <div className="p-2 space-y-1">
        <h3 className="text-sm font-medium leading-tight line-clamp-2">
          {displayName(release)}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {typeLabel && <span>{typeLabel}</span>}
          {rating != null && (
            <span className="flex items-center gap-0.5">
              <span className="text-yellow-500">&#9733;</span>
              {(rating / 10).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
