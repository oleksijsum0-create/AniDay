const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export function handlePreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }
  return null
}

export function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (!headers.has(key)) headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
