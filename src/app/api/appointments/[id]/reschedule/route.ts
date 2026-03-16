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
    const { scheduledDateTime, professionalId } = body

    if (!scheduledDateTime) {
      return NextResponse.json(
        { message: 'Nova data/hora é obrigatória' },
        { status: 400 }
      )
    }

    const appointment = await appointmentService.reschedule(id, scheduledDateTime, professionalId)
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error rescheduling appointment' },
      { status: 400 }
    )
  }
}
