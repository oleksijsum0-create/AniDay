# План: головна сторінка з сіткою аніме

## Що робимо

Проста головна сторінка: сітка карток із обкладинкою та назвою тайтлу. Дані беремо з AniLiberty (latest releases), збагачуємо AniList-метаданими (cover, рейтинг) через D1 title_links.

## Кроки

### 1. Worker API — додати endpoint `/api/v1/releases/latest`

**`apps/workers/api/src/routes/releases.ts`**
- Додати роут, який викликає AniLiberty `/anime/releases/latest?limit=30`
- AniLiberty повертає масив релізів (без `data`/`meta` обгортки), треба обробити це окремо
- Для кожного релізу: `SELECT anilist_id FROM title_links WHERE aniliberty_id = ?`
- Якщо `anilist_id` знайдено — зробити один GraphQL batch-запит до AniList (Media by id для всіх знайдених ID, type: ANIME)
- Повернути масив `{ ...release, anilist?: { title, coverImage, averageScore } | null }`
- Закешувати результат у KV (TTL: 1 год)
- Поле `coverImage` у GraphQL запиті: `extraLarge large medium color`

### 2. Типи — додати тип `EnrichedRelease` на фронтенді

**`apps/web/src/types/release.ts`**
```typescript
export interface AnilistCover {
  extraLarge: string
  large: string
  medium: string
  color: string | null
}
export interface AnilistMeta {
  id: number
  title: { romaji: string; english: string; native: string }
  coverImage: AnilistCover
  averageScore: number | null
}
export interface EnrichedRelease extends Release {
  anilist?: AnilistMeta | null
}
```

### 3. API клієнт — додати `getLatestReleases`

**`apps/web/src/lib/api/client.ts`**
- Нова функція: `getLatestReleases()` → `fetch('/api/v1/releases/latest')` → `Promise<EnrichedRelease[]>`

### 4. Компонент `AnimeCard` та сторінка

**`apps/web/src/components/anime/AnimeCard.tsx`**
- Приймає `EnrichedRelease`
- Показує:
  - Poster (або AniList coverImage, якщо є)
  - Назву (main або english)
  - AniList рейтинг (якщо є)
  - Тип (TV, Movie...)
- Посилання на `/anime/{alias}`

**`apps/web/src/app/page.tsx`**
- Client component з TanStack Query
- Викликає `getLatestReleases()`
- Рендерить сітку з `AnimeCard` (2-3-4-5 колонок responsive)
- Показує loading spinner поки запит іде

### 5. Хук для даних

**`apps/web/src/lib/api/releases.ts`**
```typescript
export function useLatestReleases() {
  return useQuery({
    queryKey: ['releases', 'latest'],
    queryFn: getLatestReleases,
    staleTime: 5 * 60 * 1000, // 5 хв
  })
}
```

## Дані

**Джерело обкладинки:**
- Пріоритет 1: `anilist.coverImage.extraLarge` (якщо є AniList матч)
- Пріоритет 2: `release.poster.optimized.preview` (AniLiberty постер)
- Fallback: `release.poster.preview`

**Джерело назви:**
- `release.name.main` (AniLiberty назва)
- `release.name.english` (якщо main немає)

## Вигляд

```text
┌─────────────────────────────────────────────┐
│  AniDay                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ cover│ │ cover│ │ cover│ │ cover│       │
│  │ назва│ │ назва│ │ назва│ │ назва│       │
│  │ ⭐8.5│ │ ⭐7.2│ │      │ │ ⭐9.1│       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ ...  │ │ ...  │ │ ...  │ │ ...  │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────────────┘
```

## Залежності

- D1 таблиця `title_links` має містити дані (створена міграцією, але поки порожня — без матчингу AniList обкладинки не підтягнуться)
- Матчинг заповниться при першому запуску daily-matching або вручну через `workflow_dispatch`
- Без матчингу — показуємо тільки AniLiberty постери та назви (це нормально для початку)

## Перевірка

1. `curl http://localhost:8787/api/v1/releases/latest` — має повернути масив з AniList даними (або без них, якщо D1 порожня)
2. `npm run dev` в `apps/web` — головна сторінка показує сітку
3. Build: `npm run build` в `apps/web` — без помилок
