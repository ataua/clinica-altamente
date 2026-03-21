import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_PREFIXES = [
  '/',
  '/login',
  '/register',
  '/calendar',
  '/patients',
  '/appointments',
  '/admin',
  '/api-docs',
  '/api',
]

const PROTECTED_PATHS = [
  '/_next',
  '/static',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PROTECTED_PATHS.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  if (ALLOWED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    return response
  }

  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
