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
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
