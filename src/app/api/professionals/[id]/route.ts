import type { NextRequest } from 'next/server'
import { professionalService } from '@/services/professional.service'
import { success, error, notFound } from '@/lib/response'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await professionalService.findById(id)

    if (!result) {
      return notFound('Professional')
    }

    return success(result)
  } catch (err) {
    return error(err)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { specialty, licenseNumber, bio, isActive, schedules } = body

    if (schedules) {
      const result = await professionalService.updateSchedule(id, schedules)
      return success(result, { message: 'Agenda atualizada' })
    }

    const result = await professionalService.update(id, {
      ...(specialty !== undefined && { specialty }),
      ...(licenseNumber !== undefined && { licenseNumber }),
      ...(bio !== undefined && { bio }),
      ...(isActive !== undefined && { isActive }),
    })

    return success(result, { message: 'Profissional atualizado' })
  } catch (err) {
    return error(err)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await professionalService.delete(id)

    return success(null, { message: 'Profissional excluído' })
  } catch (err) {
    return error(err)
  }
}
