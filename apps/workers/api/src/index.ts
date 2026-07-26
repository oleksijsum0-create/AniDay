import { Router } from 'itty-router'
import { releasesHandler } from './routes/releases'
import type { Env } from './types'

const router = Router()

router.get('/api/v1/health', () => new Response('OK'))
router.get('/api/v1/releases/latest', releasesHandler)
router.get('/api/v1/releases', releasesHandler)
router.get('/api/v1/releases/:alias', releasesHandler)

router.all('*', () => new Response('Not Found', { status: 404 }))

export default {
  fetch: router.handle,
} satisfies ExportedHandler<Env>
