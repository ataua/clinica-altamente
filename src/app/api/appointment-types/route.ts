import type { NextRequest } from 'next/server'
import { appointmentService } from '@/services/appointment.service'
import { success, created, error } from '@/lib/response'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await appointmentService.getAllTypes()
    return success(result)
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
    const { name, description, durationMinutes } = body

    if (!name || name.length < 2) {
      return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const result = await appointmentService.createType({
      name,
      description,
      durationMinutes: durationMinutes || 60,
    })

    return created(result, 'Tipo de agendamento criado')
  } catch (err) {
    return error(err)
  }
}
