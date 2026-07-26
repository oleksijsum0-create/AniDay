import type { Env } from '../types'

export function corsMiddleware(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }
}
