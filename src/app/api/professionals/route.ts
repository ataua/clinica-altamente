import type { NextRequest } from 'next/server'
import { professionalService } from '@/services/professional.service'
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

    const result = await professionalService.findAll({
      page,
      limit,
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    })

    return paginated(
      result.professionals,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      },
      request.nextUrl.origin,
      '/professionals',
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
    const { userId, specialty, licenseNumber, bio } = body

    if (!userId) {
      return Response.json({ error: 'User ID é obrigatório' }, { status: 400 })
    }
    if (!specialty || specialty.length < 2) {
      return Response.json({ error: 'Especialidade é obrigatória' }, { status: 400 })
    }

    const result = await professionalService.create({
      userId,
      specialty,
      licenseNumber,
      bio,
    })

    return created(result, 'Profissional criado')
  } catch (err) {
    return error(err)
  }
}
