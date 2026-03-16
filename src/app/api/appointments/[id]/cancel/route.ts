import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { appointmentService } from '@/services/appointment.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { message: 'Motivo do cancelamento é obrigatório' },
        { status: 400 }
      )
    }

    const appointment = await appointmentService.cancel(id, reason)
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error cancelling appointment' },
      { status: 400 }
    )
  }
}
