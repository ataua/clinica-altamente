import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const validPaths = [
  '/',
  '/login',
  '/register',
  '/calendar',
  '/patients',
  '/appointments',
  '/admin/users',
  '/api-docs',
  '/api-docs/swagger',
  '/api-docs/json',
  '/api/auth',
  '/api/users',
  '/api/patients',
  '/api/appointments',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/api-docs/json') {
    return NextResponse.next()
  }

  for (const validPath of validPaths) {
    if (pathname === validPath || pathname.startsWith(validPath + '/')) {
      return NextResponse.next()
    }
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: [
    '/((?!api-docs/json).*)',
  ],
}
