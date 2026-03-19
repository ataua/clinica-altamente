import type { NextRequest } from 'next/server'
import { specialtyService } from '@/services/specialty.service'
import { created, error, paginated } from '@/lib/response'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('isActive')

    const result = await specialtyService.findAll({
      page,
      limit,
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    })

    return paginated(
      result.specialties,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      },
      request.nextUrl.origin,
      '/specialties',
      { search: search || '' }
    )
  } catch (err) {
    return error(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.length < 2) {
      return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const existing = await specialtyService.findByName(name)
    if (existing) {
      return Response.json({ error: 'Especialidade já existe' }, { status: 409 })
    }

    const result = await specialtyService.create({
      name,
      description,
    })

    return created(result, 'Especialidade criada')
  } catch (err) {
    return error(err)
  }
}
