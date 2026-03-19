import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AppError } from './errors'
import { ZodError, ZodIssue } from 'zod'
import { generatePaginationLinks } from './hateoas'

export type HATEOASLink = {
  href: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  templated?: boolean
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  code?: string
  message?: string
  details?: ZodIssue[]
  _links?: Record<string, HATEOASLink | null>
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function success<T>(
  data: T,
  options: {
    status?: number
    message?: string
    links?: Record<string, HATEOASLink | null>
    pagination?: ApiResponse['pagination']
  } = {}
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      ...(options.message && { message: options.message }),
      ...(options.links && { _links: options.links }),
      ...(options.pagination && { pagination: options.pagination }),
    },
    { status: options.status || 200 }
  )
}

export function created<T>(
  data: T,
  message?: string,
  links?: Record<string, HATEOASLink | null>
): NextResponse<ApiResponse<T>> {
  return success(data, { status: 201, message, links })
}

export function error(err: unknown): NextResponse<ApiResponse> {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.statusCode }
    )
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues },
      { status: 400 }
    )
  }

  console.error('Unhandled error:', err)
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

export function unauthorized(message = 'Unauthorized'): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 })
}

export function forbidden(message = 'Forbidden'): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 })
}

export function notFound(resource = 'Resource'): NextResponse<ApiResponse> {
  return NextResponse.json({ error: `${resource} not found`, code: 'NOT_FOUND' }, { status: 404 })
}

export function conflict(message: string): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message, code: 'CONFLICT' }, { status: 409 })
}

export function badRequest(message: string): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message, code: 'BAD_REQUEST' }, { status: 400 })
}

export function getBaseUrl(request: NextRequest): string {
  return request.nextUrl.origin
}

export function paginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number },
  _baseUrl: string,
  resourcePath: string,
  queryParams: Record<string, string> = {}
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const fullPagination = {
    ...pagination,
    totalPages,
  }

  const paginationLinks = generatePaginationLinks(
    `/api${resourcePath}`,
    pagination.page,
    totalPages,
    queryParams
  )

  const links: Record<string, HATEOASLink | null> = {
    ...paginationLinks,
    create: { href: `/api${resourcePath}`, method: 'POST' as const },
  }

  return success(data, {
    pagination: fullPagination,
    links,
  })
}
