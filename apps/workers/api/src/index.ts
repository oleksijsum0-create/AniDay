import { Router } from 'itty-router'
import { releasesHandler } from './routes/releases'
import { sectionsHandler } from './routes/sections'
import { handlePreflight, addCorsHeaders } from './middleware/cors'
import type { Env } from './types'

const router = Router()

router.get('/api/v1/health', () => new Response('OK'))
router.get('/api/v1/releases/latest', releasesHandler)
router.get('/api/v1/releases', releasesHandler)
router.get('/api/v1/releases/:alias', releasesHandler)
router.get('/api/v1/sections/:section', sectionsHandler)

router.all('*', () => new Response('Not Found', { status: 404 }))

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const preflight = handlePreflight(request)
    if (preflight) return preflight

    const response = await router.fetch(request, env, ctx)
    return addCorsHeaders(response)
  },
} satisfies ExportedHandler<Env>
