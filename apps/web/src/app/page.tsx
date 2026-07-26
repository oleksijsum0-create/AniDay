'use client'

import { useLatestReleases } from '@/lib/api/releases'
import { useSection } from '@/lib/api/sections'
import { AnimeCard } from '@/components/anime/AnimeCard'
import type { EnrichedRelease } from '@/types/release'

const sections: {
  key: string
  title: string
  subtitle: string
  useHook: () => { data?: EnrichedRelease[]; isLoading: boolean }
}[] = [
  {
    key: 'latest',
    title: 'Latest releases',
    subtitle: 'New episodes just added',
    useHook: () => {
      const { data, isLoading } = useLatestReleases()
      return { data, isLoading }
    },
  },
  {
    key: 'trending',
    title: 'Популярне зараз',
    subtitle: 'Trending',
    useHook: () => {
      const { data, isLoading } = useSection('trending')
      return { data, isLoading }
    },
  },
  {
    key: 'ongoing',
    title: 'Нові серії',
    subtitle: 'Ongoing',
    useHook: () => {
      const { data, isLoading } = useSection('ongoing')
      return { data, isLoading }
    },
  },
  {
    key: 'top-rated',
    title: 'Найкраще оцінене',
    subtitle: 'Top Rated',
    useHook: () => {
      const { data, isLoading } = useSection('top-rated')
      return { data, isLoading }
    },
  },
  {
    key: 'upcoming',
    title: 'Скоро вийде',
    subtitle: 'Upcoming',
    useHook: () => {
      const { data, isLoading } = useSection('upcoming')
      return { data, isLoading }
    },
  },
]

function SectionRow({ releases, isLoading }: { releases?: EnrichedRelease[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[299px] w-[190px] shrink-0 animate-pulse rounded-[12px] bg-[#1e1b19]" />
        ))}
      </div>
    )
  }

  if (!releases?.length) {
    return <p className="py-4 font-[family-name:var(--font-golos)] text-[13px] text-[#a09e93]">No data yet</p>
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-2">
      {releases.map(r => (
        <AnimeCard key={r.id} release={r} />
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#161513]">
      <header className="px-6 py-8">
        <h1 className="font-[family-name:var(--font-golos)] text-[28px] font-bold tracking-[-0.5px] text-[#eeecdd]">
          AniDay
        </h1>
        <p className="mt-1 font-[family-name:var(--font-golos)] text-[13px] font-medium tracking-[-0.3px] text-[#a09e93]">
          Discover & watch
        </p>
      </header>

      <main className="flex flex-col gap-10 px-6 pb-12">
        {sections.map(section => {
          const { data, isLoading } = section.useHook()
          return (
            <section key={section.key}>
              <h2 className="font-[family-name:var(--font-golos)] text-[18px] font-bold tracking-[-0.5px] text-[#eeecdd]">
                {section.title}
              </h2>
              <p className="mt-[-2px] font-[family-name:var(--font-golos)] text-[13px] font-medium tracking-[-0.3px] text-[#a09e93]">
                {section.subtitle}
              </p>
              <div className="mt-3">
                <SectionRow releases={data} isLoading={isLoading} />
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
