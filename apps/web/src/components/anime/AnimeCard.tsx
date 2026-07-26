import Link from 'next/link'
import { Play, Bookmark } from 'lucide-react'
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

export function AnimeCard({ release, rank }: { release: EnrichedRelease; rank?: number }) {
  const cover = release.anilist?.coverImage?.extraLarge ?? posterUrl(release)
  const typeLabel = release.type?.description ?? release.type?.value ?? ''

  return (
    <Link
      href={`/anime/${release.alias}`}
      className="group relative block w-[190px]"
    >
      <div className="relative h-[299px]">
        <div className="absolute left-3 top-[15px] z-10 h-[238px] w-[168px] overflow-hidden rounded-sm">
          {cover ? (
            <img
              src={cover}
              alt={displayName(release)}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1e1b19] p-2 text-center text-xs text-[#a09e93]">
              {displayName(release)}
            </div>
          )}

          <div className="absolute right-[7px] top-[7px] flex flex-col gap-[9px]">
            <div className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-[#c7e5a9] opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-[11px] w-[11px] text-[#161513]" fill="#161513" />
            </div>
            <div className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-[#ec9b9b] opacity-0 transition-opacity group-hover:opacity-100">
              <Bookmark className="h-[10px] w-[10px] text-[#161513]" />
            </div>
          </div>
        </div>

        <h3
          className="absolute left-3 top-[253px] m-0 font-[family-name:var(--font-golos)] text-[13px] font-bold leading-[18px] tracking-[-0.65px] text-[#edebdc]"
        >
          {displayName(release)}
        </h3>

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="flex h-[14px] items-center gap-[2px] rounded-lg bg-[#d9d9d9] px-[7px]">
            <span
              className="font-[family-name:var(--font-itim)] text-[13px] font-normal leading-none tracking-[-0.65px] text-[#161513]"
            >
              #
            </span>
            <span className="font-[family-name:var(--font-golos)] text-[11px] font-bold leading-none text-[#161513]">
              {rank ?? 1}
            </span>
          </div>

          {typeLabel && (
            <span className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#a09e93]">
              {typeLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
