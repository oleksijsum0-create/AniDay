'use client'

import { useLatestReleases } from '@/lib/api/releases'
import { AnimeCard } from '@/components/anime/AnimeCard'

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card overflow-hidden animate-pulse">
          <div className="aspect-[3/4] bg-muted" />
          <div className="p-2 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="text-center py-20">
      <p className="text-destructive font-medium">Failed to load releases</p>
      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <p className="col-span-full text-center py-20 text-muted-foreground">
      No releases available yet
    </p>
  )
}

export default function Home() {
  const { data: releases, isLoading, error } = useLatestReleases()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">AniDay</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Latest anime releases
      </p>

      {isLoading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState error={error} />
      ) : !releases || releases.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {releases.map(r => (
            <AnimeCard key={r.id} release={r} />
          ))}
        </div>
      )}
    </div>
  )
}
