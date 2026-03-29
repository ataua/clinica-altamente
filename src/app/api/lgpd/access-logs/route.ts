import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { lgpdService } from '@/services/lgpd.service'
import { error, paginated } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return error({ status: 401, message: 'Unauthorized' })
    }

    const userRole = session.user.role
    if (userRole !== 'ADMIN') {
      return error({ status: 403, message: 'Access denied' })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined

    const result = await lgpdService.getAccessLogs({
      page,
      limit,
      userId,
      entityType,
      entityId,
    })

    return paginated(
      result.logs,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      },
      request.nextUrl.origin,
      '/lgpd/access-logs',
      { userId: userId || '', entityType: entityType || '', entityId: entityId || '' }
    )
  } catch (err) {
    console.error('Error fetching access logs:', err)
    return error(err)
  }
}
