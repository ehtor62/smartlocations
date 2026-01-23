import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
