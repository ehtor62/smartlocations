import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware is now disabled - using OAuth Bearer token authentication on API routes instead
// To re-enable basic auth for the entire site, uncomment the code below

export function middleware(request: NextRequest) {
  // Basic auth disabled - API routes now use Firebase OAuth tokens
  return NextResponse.next()
}

/*
// Original Basic Auth Implementation (now replaced by OAuth)
export function middleware(request: NextRequest) {
  const auth = request.headers.get('authorization')
  
  // Use environment variables for credentials (fallback to defaults)
  const username = process.env.BASIC_AUTH_USER || 'user'
  const password = process.env.BASIC_AUTH_PASSWORD || 'pass'
  const validAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

  if (auth !== validAuth) {
    return new NextResponse('Access Denied', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected Area"',
      },
    })
  }
}
*/
