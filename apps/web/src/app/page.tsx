'use client'

import { useLatestReleases } from '@/lib/api/releases'
import { AnimeCard } from '@/components/anime/AnimeCard'

export default function Home() {
  const { data: releases, isLoading } = useLatestReleases()

  return (
    <div className="min-h-screen bg-[#161513]">
      <header className="px-6 py-8">
        <h1 className="font-[family-name:var(--font-golos)] text-[28px] font-bold tracking-[-0.5px] text-[#eeecdd]">
          AniDay
        </h1>
        <p className="mt-1 font-[family-name:var(--font-golos)] text-[13px] font-medium tracking-[-0.3px] text-[#a09e93]">
          Latest releases
        </p>
      </header>

      <main className="px-6 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,190px)] gap-x-5 gap-y-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-[299px] w-[190px] animate-pulse rounded-sm bg-[#1e1b19]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,190px)] gap-x-5 gap-y-6">
            {releases?.map((r, i) => (
              <AnimeCard key={r.id} release={r} rank={i + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
