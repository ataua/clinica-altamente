import type { NextRequest } from 'next/server'
import { appointmentService } from '@/services/appointment.service'
import { success, error } from '@/lib/response'
import { auth } from '@/lib/auth'

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
    const { name, description, durationMinutes, isActive } = body

    await appointmentService.updateType(id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(isActive !== undefined && { isActive }),
    })

    return success(null, { message: 'Tipo de agendamento atualizado' })
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
    await appointmentService.deleteType(id)

    return success(null, { message: 'Tipo de agendamento excluído' })
  } catch (err) {
    return error(err)
  }
}
